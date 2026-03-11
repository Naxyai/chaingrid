import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const BSC_RPC = "https://bsc-dataseed.binance.org/";
const USDT_DECIMALS = 18;

// ─── ABI encode: withdraw(address recipient, uint256 netAmountWei) ─────────────
// Function selector = keccak256("withdraw(address,uint256)")[0:4] = 0x00f714ce
function encodeWithdrawCall(recipient: string, netAmountWei: bigint): string {
  const selector = "00f714ce";
  const paddedAddr = recipient.toLowerCase().replace("0x", "").padStart(64, "0");
  const paddedAmt  = netAmountWei.toString(16).padStart(64, "0");
  return "0x" + selector + paddedAddr + paddedAmt;
}

// ─── Raw JSON-RPC helpers ─────────────────────────────────────────────────────

async function rpcCall<T>(method: string, params: unknown[]): Promise<T> {
  const res = await fetch(BSC_RPC, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  const json = await res.json() as { result?: T; error?: { message: string } };
  if (json.error) throw new Error(`RPC error: ${json.error.message}`);
  return json.result as T;
}

async function getTransactionCount(address: string): Promise<number> {
  const r = await rpcCall<string>("eth_getTransactionCount", [address, "latest"]);
  return parseInt(r, 16);
}

async function getGasPrice(): Promise<bigint> {
  const r = await rpcCall<string>("eth_gasPrice", []);
  return BigInt(r);
}

async function sendRawTransaction(raw: string): Promise<string> {
  return rpcCall<string>("eth_sendRawTransaction", [raw]);
}

// ─── Sign and broadcast ───────────────────────────────────────────────────────

async function executeWithdraw(
  privateKey: string,
  contractAddress: string,
  recipient: string,
  netAmountWei: bigint,
): Promise<string> {
  const { ethers } = await import("npm:ethers@6");
  const wallet = new ethers.Wallet(privateKey);

  const data     = encodeWithdrawCall(recipient, netAmountWei);
  const nonce    = await getTransactionCount(wallet.address);
  const gasPrice = await getGasPrice();

  const tx = {
    to:       contractAddress,
    data,
    nonce,
    gasPrice,
    gasLimit: BigInt(120000),
    chainId:  BigInt(56),
    value:    BigInt(0),
  };

  const signed = await wallet.signTransaction(tx);
  return sendRawTransaction(signed);
}

// ─── Handler ─────────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl     = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey         = Deno.env.get("SUPABASE_ANON_KEY")!;
    const signerKey       = Deno.env.get("SIGNER_PRIVATE_KEY");
    const contractAddress = Deno.env.get("CONTRACT_ADDRESS");

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json() as {
      withdrawal_id: string;
      wallet_address: string;
      net_amount: number;
    };
    const { withdrawal_id, wallet_address, net_amount } = body;

    if (!withdrawal_id || !wallet_address || !net_amount || net_amount <= 0) {
      return new Response(JSON.stringify({ error: "Invalid request parameters" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: withdrawal, error: wErr } = await adminClient
      .from("withdrawals")
      .select("id, status, net_amount, wallet_address")
      .eq("id", withdrawal_id)
      .maybeSingle();

    if (wErr || !withdrawal) {
      return new Response(JSON.stringify({ error: "Withdrawal not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (withdrawal.status !== "pending") {
      return new Response(JSON.stringify({ error: "Withdrawal already processed" }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const notConfigured =
      !signerKey ||
      !contractAddress ||
      contractAddress === "0x0000000000000000000000000000000000000000";

    if (notConfigured) {
      return new Response(
        JSON.stringify({
          error: "Contract not deployed yet. Set CONTRACT_ADDRESS and SIGNER_PRIVATE_KEY secrets.",
          code: "SIGNER_NOT_CONFIGURED",
        }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    await adminClient
      .from("withdrawals")
      .update({ status: "processing" })
      .eq("id", withdrawal_id);

    // Use the net_amount stored in the DB (fee already deducted off-chain)
    const netAmountWei = BigInt(
      Math.round((withdrawal.net_amount as number) * Math.pow(10, USDT_DECIMALS))
    );
    const recipientAddr = (withdrawal.wallet_address as string) || wallet_address;

    let txHash: string;
    try {
      txHash = await executeWithdraw(signerKey!, contractAddress!, recipientAddr, netAmountWei);
    } catch (err) {
      await adminClient
        .from("withdrawals")
        .update({ status: "failed" })
        .eq("id", withdrawal_id);

      return new Response(
        JSON.stringify({ error: `On-chain transfer failed: ${(err as Error).message}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    await adminClient
      .from("withdrawals")
      .update({ status: "completed", tx_hash: txHash, completed_at: new Date().toISOString() })
      .eq("id", withdrawal_id);

    await adminClient
      .from("transactions")
      .update({ reference_id: txHash })
      .eq("reference_id", withdrawal_id)
      .eq("type", "withdrawal");

    return new Response(
      JSON.stringify({ success: true, tx_hash: txHash }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
