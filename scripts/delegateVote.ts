import { ethers, Contract } from "ethers";
// eslint-disable-next-line node/no-missing-import
import { Ballot } from "../typechain";
import "dotenv/config";
import BallotArtifact from "../artifacts/contracts/Ballot.sol/Ballot.json";

//never expose your keys like this
const EXPOSED_KEY = "potato";

async function main() {
  const wallet =
    process.env.MNEMONIC && process.env.MNEMONIC.length > 0
      ? ethers.Wallet.fromMnemonic(process.env.MNEMONIC)
      : new ethers.Wallet(process.env.PRIVATE_KEY ?? EXPOSED_KEY);
  console.log(`Using address ${wallet.address}`);
  const provider = ethers.providers.getDefaultProvider("ropsten", {
    etherscan: process.env.ETHERSCAN_API_KEY,
  });
  const signer = wallet.connect(provider);
  const balanceBN = await signer.getBalance();
  const balance = Number(ethers.utils.formatEther(balanceBN));
  console.log(`Wallet balance ${balance}`);
  if (balance < 0.01) {
    throw new Error("Not enough ether");
  }
  if (process.argv.length < 3) throw new Error("Ballot address missing");
  const ballotAddress = process.argv[2];
  if (process.argv.length < 4) throw new Error("Voter address missing");
  const toAddress = process.argv[3];
  console.log({ ballotAddress, toAddress });
  console.log(
    `Attaching ballot contract interface to address ${ballotAddress}`
  );

  //creating new contract
  const ballotContract: Ballot = new Contract(
    ballotAddress,
    BallotArtifact.abi,
    signer
  ) as Ballot;

  //checking chairperson
  const chairpersonAddress = await ballotContract.chairperson();
  if (chairpersonAddress !== signer.address)
    throw new Error("Self-delegation is disallowed");

  if (signer.address === toAddress) {
    throw new Error("You already voted");
  }
  console.log(`delegating vote to ${toAddress}`);

  //delegating vote to another voter
  const tx = await ballotContract.delegate(toAddress);
  console.log("Awaiting confirmations");
  await tx.wait();
  console.log(`Transaction completed. Hash: ${tx.hash}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
