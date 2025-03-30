const { expect } = require("chai");
const { ethers } = require("hardhat");

const tokens = (n) => {
  return ethers.parseUnits(n.toString(), "ether");
};

describe("Escrow", () => {
  let realEstate, escrow;
  let buyer, seller, inspector, lender;

  beforeEach(async () => {
    // setup accoutn
    [buyer, seller, inspector, lender] = await ethers.getSigners();

    //Deploy RealEstate
    const RealEstate = await ethers.getContractFactory("RealEstate");
    realEstate = await RealEstate.deploy();
    await realEstate.waitForDeployment();

    // mint
    let transaction = await realEstate
      .connect(seller)
      .mint(
        "https://ipfs.io/ipfs/QmTudSYeM7mz3PkYEWXWqPjomRPHogcMFSq7XAvsvsgAPS"
      );

    await transaction.wait();

    // Deploy Escrow
    const Escrow = await ethers.getContractFactory("Escrow");
    escrow = await Escrow.deploy(
      realEstate.target,
      seller.address,
      inspector.address,
      lender.address
    );

    // Approve Property
    transaction = await realEstate.connect(seller).approve(escrow.target, 1);
    await transaction.wait();

    // List Property
    transaction = await escrow
      .connect(seller)
      .list(1, buyer.address, tokens(10), tokens(5));
    await transaction.wait();
  });

  describe("Deployment", () => {
    it("Returns NFT address", async () => {
      const result = await escrow.nftAddress();
      expect(result).to.be.equal(realEstate.target);
    });

    it("Returns seller", async () => {
      const result = await escrow.seller();
      expect(result).to.be.equal(seller.address);
    });

    it("Returns inspector", async () => {
      const result = await escrow.inspector();
      expect(result).to.be.equal(inspector.address);
    });

    it("Returns lender", async () => {
      const result = await escrow.lender();
      expect(result).to.be.equal(lender.address);
    });
  });

  describe("Listing", () => {
    it("Update ownership", async () => {
      expect(await realEstate.ownerOf(1)).to.be.equal(escrow.target);
    });

    it("Updates as listed", async () => {
      expect(await escrow.isListed(1)).to.be.equal(true);
    });

    it("Return buyer", async () => {
      expect(await escrow.buyer(1)).to.be.equal(buyer.address);
    });

    it("Returns purchase price", async () => {
      expect(await escrow.purchasePrice(1)).to.be.equal(tokens(10));
    });

    it("Returns escrow amount", async () => {
      expect(await escrow.escrowAmount(1)).to.be.equal(tokens(5));
    });
  });
});
