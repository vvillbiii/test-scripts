import { ethers } from "ethers";
import "dotenv/config";
// eslint-disable-next-line node/no-missing-import
import { Ballot } from "../typechain";
import BallotArtifact from "../artifacts/contracts/Ballot.sol/Ballot.json";

const PROPOSALS = ["Proposal 1", "Proposal 2", "Proposal 3"];

function convertStringArrayToBytes32(array: string[]) {
  const bytes32Array = [];
  for (let index = 0; index < array.length; index++) {
    bytes32Array.push(ethers.utils.formatBytes32String(array[index]));
  }
  return bytes32Array;
}

//never expose your keys like this
const EXPOSED_KEY = "potato";

async function main() {
  //connecting wallet to ethers
  const wallet =
    process.env.MNEMONIC && process.env.MNEMONIC.length > 0
      ? ethers.Wallet.fromMnemonic(process.env.MNEMONIC)
      : new ethers.Wallet(process.env.PRIVATE_KEY ?? EXPOSED_KEY);

  //getting provider
  const provider = ethers.providers.getDefaultProvider("ropsten", {
    etherscan: process.env.ETHERSCAN_API_KEY,
  });
  console.log(`using wallet ${wallet.address}`);

  const signer = wallet.connect(provider);

  //getting the wallet balance
  const balanceBN = await signer.getBalance();
  // console.log({ balanceBN });
  // console.log(ethers.utils.formatEther(balanceBN));
  const balance = Number(ethers.utils.formatEther(balanceBN));
  // console.log(`Wallet balance ${balance}`);

  //looking at last block from provider
  const lastBlock = await provider.getBlock("latest");
  console.log({ lastBlock });
  console.log(`Connected to the ropsten network at height ${lastBlock.number}`);

  //creating new contract factory
  const ballotFactory = new ethers.ContractFactory(
    BallotArtifact.abi,
    BallotArtifact.bytecode,
    signer
  );

  //deploying contract
  console.log("Deploying ballot contract");
  const ballotContract: Ballot = (await ballotFactory.deploy(
    convertStringArrayToBytes32(PROPOSALS)
  )) as Ballot;
  console.log(`awaiting confirnmations`);

  const deploymentTX = await ballotContract.deployed();
  console.log(`completed`);
  console.log(deploymentTX);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
