// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title  CycleWithdrawal
 * @notice USDT liquidity vault for the 100Cycle withdrawal system.
 *
 * ─── How it works ─────────────────────────────────────────────────────────────
 *
 *  1. Owner deploys this contract (providing USDT address + signer address).
 *  2. Owner transfers USDT directly into the contract address as liquidity.
 *     (Standard ERC-20 transfer — no approval step required for the owner.)
 *  3. Owner sends BNB to the contract so the signer wallet can be refuelled
 *     for gas via fundSigner().
 *  4. When a user requests a withdrawal on the platform:
 *       a. Off-chain: 10 % platform fee is deducted from the gross reward.
 *       b. The net (post-fee) amount is recorded in the database.
 *       c. The backend edge function calls withdraw(recipient, netAmountWei)
 *          from the authorised signer wallet.
 *       d. The contract transfers exactly netAmountWei USDT to the recipient.
 *
 *  Fee deduction is intentionally off-chain.  The contract is only responsible
 *  for safe custody and authorised disbursement of USDT.
 *
 * ─── Access control ───────────────────────────────────────────────────────────
 *
 *  owner  — deploys contract, deposits USDT/BNB, rotates signer, pauses.
 *  signer — hot wallet operated by the backend; the only address that may call
 *           withdraw().  Owner provides its address at deploy time and can
 *           rotate it via setSigner().
 *
 * ─── Deployment parameters ────────────────────────────────────────────────────
 *
 *  _usdtAddress : 0x55d398326f99059fF775485246999027B3197955  (BSC USDT BEP-20)
 *  _signer      : the hot-wallet address whose private key is stored as the
 *                 SIGNER_PRIVATE_KEY secret in the backend edge function.
 */

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract CycleWithdrawal {

    // ─────────────────────────── State ───────────────────────────────────────

    address public owner;
    address public signer;
    IERC20  public immutable usdt;
    bool    public paused;

    // ─────────────────────────── Events ──────────────────────────────────────

    event USDTDeposited(address indexed from, uint256 amount);
    event BNBDeposited(address indexed from, uint256 amount);
    event Withdrawn(address indexed recipient, uint256 netAmount);
    event SignerRotated(address indexed oldSigner, address indexed newSigner);
    event OwnershipTransferred(address indexed oldOwner, address indexed newOwner);
    event Paused(bool isPaused);
    event USDTRecovered(address indexed to, uint256 amount);
    event BNBRecovered(address indexed to, uint256 amount);

    // ─────────────────────────── Errors ──────────────────────────────────────

    error NotOwner();
    error NotSigner();
    error ZeroAddress();
    error ZeroAmount();
    error InsufficientUSDT(uint256 available, uint256 requested);
    error ContractPaused();
    error TransferFailed();
    error BNBTransferFailed();

    // ─────────────────────────── Modifiers ───────────────────────────────────

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    modifier onlySigner() {
        if (msg.sender != signer) revert NotSigner();
        _;
    }

    modifier whenNotPaused() {
        if (paused) revert ContractPaused();
        _;
    }

    // ─────────────────────────── Constructor ─────────────────────────────────

    constructor(address _usdtAddress, address _signer) {
        if (_usdtAddress == address(0)) revert ZeroAddress();
        if (_signer      == address(0)) revert ZeroAddress();

        owner  = msg.sender;
        signer = _signer;
        usdt   = IERC20(_usdtAddress);
    }

    // ─────────────────────────── Receive BNB ─────────────────────────────────

    /**
     * @notice Accept plain BNB transfers.
     *         Owner sends BNB here, then calls fundSigner() to top up the
     *         hot wallet with gas money.
     */
    receive() external payable {
        emit BNBDeposited(msg.sender, msg.value);
    }

    // ─────────────────────────── Owner Functions ─────────────────────────────

    /**
     * @notice Notify the contract that USDT has been transferred in.
     * @dev    The owner simply sends USDT directly to this contract address
     *         using a standard ERC-20 transfer from their wallet or any
     *         interface (MetaMask, BscScan, etc.).  This function is optional —
     *         it emits an event so deposits are traceable on-chain.
     * @param  amount  The amount (in USDT wei) that was transferred in.
     */
    function notifyUSDTDeposit(uint256 amount) external onlyOwner {
        if (amount == 0) revert ZeroAmount();
        emit USDTDeposited(msg.sender, amount);
    }

    /**
     * @notice Deposit BNB into the contract to later fund the signer's gas.
     *         Alternatively, send BNB directly to this contract address.
     */
    function depositBNB() external payable onlyOwner {
        if (msg.value == 0) revert ZeroAmount();
        emit BNBDeposited(msg.sender, msg.value);
    }

    /**
     * @notice Push BNB from the contract to the signer wallet to cover gas.
     * @param  amount  Amount in wei to send to the signer.
     */
    function fundSigner(uint256 amount) external onlyOwner {
        if (amount == 0) revert ZeroAmount();
        (bool ok, ) = signer.call{value: amount}("");
        if (!ok) revert BNBTransferFailed();
    }

    /**
     * @notice Replace the authorised signer wallet.
     *         Call this whenever the private key is rotated.
     */
    function setSigner(address newSigner) external onlyOwner {
        if (newSigner == address(0)) revert ZeroAddress();
        emit SignerRotated(signer, newSigner);
        signer = newSigner;
    }

    /**
     * @notice Transfer contract ownership to a new address.
     */
    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert ZeroAddress();
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    /**
     * @notice Pause or unpause all withdrawals (emergency circuit breaker).
     */
    function setPaused(bool _paused) external onlyOwner {
        paused = _paused;
        emit Paused(_paused);
    }

    /**
     * @notice Recover USDT from the contract back to the owner.
     * @dev    Can only be called while the contract is paused, protecting
     *         against accidental draining while the system is live.
     */
    function recoverUSDT(uint256 amount) external onlyOwner {
        if (!paused) revert ContractPaused();
        if (amount == 0) revert ZeroAmount();
        bool ok = usdt.transfer(owner, amount);
        if (!ok) revert TransferFailed();
        emit USDTRecovered(owner, amount);
    }

    /**
     * @notice Recover BNB from the contract back to the owner.
     */
    function recoverBNB(uint256 amount) external onlyOwner {
        if (amount == 0) revert ZeroAmount();
        (bool ok, ) = owner.call{value: amount}("");
        if (!ok) revert BNBTransferFailed();
        emit BNBRecovered(owner, amount);
    }

    // ─────────────────────────── Core Withdrawal ─────────────────────────────

    /**
     * @notice Transfer USDT to a user's wallet.
     *
     * @dev    Only callable by the authorised signer wallet.
     *         The 10 % platform fee has already been deducted off-chain before
     *         this function is called.  This contract transfers the exact
     *         net amount provided — no additional fee logic here.
     *
     *         The signer wallet must hold enough BNB to pay for gas.
     *         Fund it via fundSigner() or by sending BNB directly to it.
     *
     * @param  recipient     User's BSC wallet address.
     * @param  netAmountWei  Net USDT amount to send (18 decimals), already
     *                       net of the 10 % platform fee deducted off-chain.
     */
    function withdraw(
        address recipient,
        uint256 netAmountWei
    ) external onlySigner whenNotPaused {
        if (recipient   == address(0)) revert ZeroAddress();
        if (netAmountWei == 0)         revert ZeroAmount();

        uint256 balance = usdt.balanceOf(address(this));
        if (balance < netAmountWei)
            revert InsufficientUSDT(balance, netAmountWei);

        bool ok = usdt.transfer(recipient, netAmountWei);
        if (!ok) revert TransferFailed();

        emit Withdrawn(recipient, netAmountWei);
    }

    // ─────────────────────────── View Functions ───────────────────────────────

    /**
     * @notice Current USDT balance held by this contract.
     */
    function usdtBalance() external view returns (uint256) {
        return usdt.balanceOf(address(this));
    }

    /**
     * @notice Current BNB balance held by this contract.
     */
    function bnbBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
