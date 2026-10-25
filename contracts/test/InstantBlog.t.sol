// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {InstantBlog} from "../src/InstantBlog.sol";

/// Mirrors docs/CONTRACT_SPEC.md §8 (manual testnet checklist).
contract InstantBlogTest is Test {
    InstantBlog ib;
    bytes32 constant H = bytes32(uint256(1));
    address alice = makeAddr("alice");
    address bob = makeAddr("bob");

    event Stamped(uint256 indexed id, address indexed author, bytes32 textHash, string title);

    function setUp() public {
        ib = new InstantBlog();
    }

    function test_StampReturnsOneBasedIdsAndEmits() public {
        vm.expectEmit(true, true, false, true);
        emit Stamped(1, alice, H, "Hello");
        vm.prank(alice);
        assertEq(ib.stamp(H, "Hello", 100, 0, 0), 1);
        assertEq(ib.total(), 1);

        vm.prank(alice);
        assertEq(ib.stamp(H, "Hello", 100, 0, 0), 2);
        uint256[] memory ids = ib.proofsForHash(H);
        assertEq(ids.length, 2);
        assertEq(ids[0], 1);
        assertEq(ids[1], 2);
    }

    function test_GetProofFields() public {
        vm.warp(1_790_000_000);
        vm.prank(bob);
        ib.stamp(H, "B", 7, 1, 2);
        InstantBlog.Proof memory p = ib.getProof(1);
        assertEq(p.author, bob);
        assertEq(p.textHash, H);
        assertEq(p.title, "B");
        assertEq(p.words, 7);
        assertEq(p.tone, 1);
        assertEq(p.sources, 2);
        assertEq(p.at, 1_790_000_000);
    }

    function test_UnknownProof() public {
        vm.expectRevert(InstantBlog.UnknownProof.selector);
        ib.getProof(0);
        vm.expectRevert(InstantBlog.UnknownProof.selector);
        ib.getProof(1);
    }

    function test_TitleByteLimit() public {
        // 40 × 4-byte emoji = 160 bytes → allowed
        string memory emoji160 = unicode"😀😀😀😀😀😀😀😀😀😀😀😀😀😀😀😀😀😀😀😀😀😀😀😀😀😀😀😀😀😀😀😀😀😀😀😀😀😀😀😀";
        assertEq(bytes(emoji160).length, 160);
        ib.stamp(H, emoji160, 1, 5, 5);
        vm.expectRevert(InstantBlog.TitleTooLong.selector);
        ib.stamp(H, string.concat(emoji160, "a"), 1, 0, 0);
    }

    function test_Validation() public {
        vm.expectRevert(InstantBlog.EmptyHash.selector);
        ib.stamp(bytes32(0), "t", 1, 0, 0);
        vm.expectRevert(InstantBlog.EmptyTitle.selector);
        ib.stamp(H, "", 1, 0, 0);
        vm.expectRevert(InstantBlog.ZeroWords.selector);
        ib.stamp(H, "t", 0, 0, 0);
        vm.expectRevert(InstantBlog.BadTone.selector);
        ib.stamp(H, "t", 1, 6, 0);
        vm.expectRevert(InstantBlog.TooManySources.selector);
        ib.stamp(H, "t", 1, 0, 6);
    }

    function test_ProofsOfAuthor() public {
        vm.startPrank(alice);
        ib.stamp(H, "a1", 1, 0, 0);
        ib.stamp(bytes32(uint256(2)), "a2", 1, 0, 0);
        vm.stopPrank();
        vm.prank(bob);
        ib.stamp(H, "b1", 1, 0, 0);
        assertEq(ib.proofsOf(alice).length, 2);
        assertEq(ib.proofsOf(bob)[0], 3);
        assertEq(ib.proofsForHash(H).length, 2);
    }

    function testFuzz_StampValid(bytes32 h, uint32 words, uint8 tone, uint8 sources) public {
        vm.assume(h != bytes32(0) && words > 0 && tone <= 5 && sources <= 5);
        uint256 id = ib.stamp(h, "Fuzz", words, tone, sources);
        InstantBlog.Proof memory p = ib.getProof(id);
        assertEq(p.textHash, h);
        assertEq(p.words, words);
    }
}
