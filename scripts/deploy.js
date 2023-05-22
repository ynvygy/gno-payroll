// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hardhat = require("hardhat");
const fs = require("fs/promises")

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  const Payroll = await hre.ethers.getContractFactory("Payroll");
  const payrollContract = await Payroll.deploy();
  await payrollContract.deployed()
  console.log("Payroll contract deployed to:", payrollContract.address);

  const amountToSend = hre.ethers.utils.parseEther("7000");

  const tx = {
    to: payrollContract.address,
    value: amountToSend,
  };

  const receipt = await deployer.sendTransaction(tx);
  console.log("Funds transferred to the contract:", receipt);

  await writeDeploymentInfo("payroll", payrollContract)
}

async function writeDeploymentInfo(filename, contract) {
  const data = {
    contract: {
      address: contract.address,
      signerAddress: contract.signer.address,
      abi: contract.interface.format()
    }
  }

  const content = JSON.stringify(data, null, 2);
  await fs.writeFile(`src/data/${filename}-contract.json`, content, { encoding: "utf-8"})
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
