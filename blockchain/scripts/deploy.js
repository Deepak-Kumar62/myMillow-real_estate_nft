const hre = require("hardhat");

function tokens(n) {
  return ethers.parseUnits(n.toString(), "ether");
}

async function main() {
  // setup account
  const [buyer, seller, inspector, lender] = await ethers.getSigners();

  // Deploy RealEstate
  const RealEstate = await ethers.getContractFactory("RealEstate");
  const realEState = await RealEstate.deploy();
  await realEState.waitForDeployment();

  console.log("Deployed realEstate contract at: ", realEState.target);

  console.log(`Minting 3 properties...\n`);
  for (let i = 0; i < 3; i++) {
    const transaction = await realEState
      .connect(seller)
      .mint(
        `https://ipfs.io/ipfs/QmQVcpsjrA6cr1iJjZAodYwmPekYgbnXGo4DFubJiLc2EB/${
          i + 1
        }.json`
      );
    await transaction.wait();
  }

  // Deploy Escrow
  const Escrow = await ethers.getContractFactory("Escrow");
  const escrow = await Escrow.deploy(
    realEState.target,
    seller.address,
    inspector.address,
    lender.address
  );
  await escrow.waitForDeployment();

  // Approve property
  for (let i = 0; i < 3; i++) {
    let transaction = await realEState.connect(seller).approve(escrow.target, i + 1)
    await transaction.wait()
  }

  console.log(`Deployed Escrow Contract at: ${escrow.target}`);

  console.log(`Listing 3 properties...\n`);
  let transaction = await escrow
    .connect(seller)
    .list(1, buyer.address, tokens(20), tokens(10));
  await transaction.wait();

  transaction = await escrow
    .connect(seller)
    .list(2, buyer.address, tokens(15), tokens(5));
  await transaction.wait();

  transaction = await escrow
    .connect(seller)
    .list(3, buyer.address, tokens(10), tokens(5));
  await transaction.wait();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
