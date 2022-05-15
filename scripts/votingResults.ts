import { ethers, Contract, BigNumber } from "ethers";
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
  console.log({ ballotAddress });
  console.log(
    `Attaching ballot contract interface to address ${ballotAddress}`
  );

  //creating contract
  const ballotContract: Ballot = new Contract(
    ballotAddress,
    BallotArtifact.abi,
    signer
  ) as Ballot;

  const proposalLength = await ballotContract.getProposalsArrayLength();

  for (let i = 0; i < Number(proposalLength); i++) {
    console.log(
      `proposal ${await ballotContract.proposals(i)} has ${
        (await ballotContract.proposals(i)).voteCount
      } votes.`
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
