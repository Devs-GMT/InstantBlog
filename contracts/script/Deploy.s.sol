// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {InstantBlog} from "../src/InstantBlog.sol";

/// forge script script/Deploy.s.sol --rpc-url botchain_testnet --broadcast
/// Reads PRIVATE_KEY from the environment (contracts/.env, gitignored).
contract Deploy is Script {
    function run() external returns (InstantBlog ib) {
        uint256 key = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(key);
        ib = new InstantBlog();
        vm.stopBroadcast();
        console.log("InstantBlog deployed at", address(ib));
        console.log("chain id", block.chainid);
    }
}
