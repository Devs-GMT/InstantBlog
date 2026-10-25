// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title InstantBlog — proof of authorship for AI-assisted articles
/// @notice Stores a SHA-256 fingerprint of an article with a timestamp. Never the text.
/// @dev A proof shows who stamped this exact text and when — not that they wrote every word without AI.
contract InstantBlog {
    struct Proof {
        address author;
        bytes32 textHash;
        string title;
        uint32 words;
        uint8 tone;
        uint8 sources;
        uint64 at;
    }

    uint256 public constant MAX_TITLE_BYTES = 160;
    uint8 public constant MAX_TONE = 5;
    uint8 public constant MAX_SOURCES = 5;

    Proof[] private _proofs;
    mapping(bytes32 => uint256[]) private _byHash;
    mapping(address => uint256[]) private _byAuthor;

    event Stamped(uint256 indexed id, address indexed author, bytes32 textHash, string title);

    error EmptyHash();
    error EmptyTitle();
    error TitleTooLong();
    error ZeroWords();
    error BadTone();
    error TooManySources();
    error UnknownProof();

    /// @notice Stamp an article fingerprint. Returns the 1-based proof id.
    function stamp(
        bytes32 textHash,
        string calldata title,
        uint32 words,
        uint8 tone,
        uint8 sources
    ) external returns (uint256 id) {
        if (textHash == bytes32(0)) revert EmptyHash();
        uint256 len = bytes(title).length;
        if (len == 0) revert EmptyTitle();
        if (len > MAX_TITLE_BYTES) revert TitleTooLong();
        if (words == 0) revert ZeroWords();
        if (tone > MAX_TONE) revert BadTone();
        if (sources > MAX_SOURCES) revert TooManySources();

        _proofs.push(Proof(msg.sender, textHash, title, words, tone, sources, uint64(block.timestamp)));
        id = _proofs.length; // 1-based

        _byHash[textHash].push(id);
        _byAuthor[msg.sender].push(id);

        emit Stamped(id, msg.sender, textHash, title);
    }

    function getProof(uint256 id) external view returns (Proof memory) {
        if (id == 0 || id > _proofs.length) revert UnknownProof();
        return _proofs[id - 1];
    }

    function proofsForHash(bytes32 textHash) external view returns (uint256[] memory) {
        return _byHash[textHash];
    }

    function proofsOf(address author) external view returns (uint256[] memory) {
        return _byAuthor[author];
    }

    function total() external view returns (uint256) {
        return _proofs.length;
    }
}
