// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/// Vetted ScoreRegistry: one 0-100 score + A-F grade per validator (bytes32 Substrate account id) per era.
/// Scores are read from ScorePublished events. Grade is its ASCII code: 65 A, 66 B, 67 C, 68 D, 70 F.
contract ScoreRegistry {
    address public owner;
    address public publisher;
    mapping(bytes32 => bool) private _done; // keccak(validator, era) => published

    event ScorePublished(bytes32 indexed validator, uint256 indexed era, uint256 score, uint256 grade);

    constructor() { owner = msg.sender; }

    function setPublisher(address account) external {
        require(msg.sender == owner);
        publisher = account;
    }

    function publish(bytes32 validator, uint256 era, uint256 score, uint256 grade) external {
        require(msg.sender == owner || msg.sender == publisher);
        uint256 g = 70;
        if (score >= 30) g = 68;
        if (score >= 50) g = 67;
        if (score >= 65) g = 66;
        if (score >= 85) g = 65;
        bytes32 k = keccak256(abi.encode(validator, era));
        require(score <= 100 && grade == g && era != 0 && !_done[k]);
        _done[k] = true;
        emit ScorePublished(validator, era, score, grade);
    }
}
