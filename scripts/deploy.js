// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");

const tokens = (n) => {
  return hre.ethers.utils.parseUnits(n.toString(), 'ether')
}

async function main() {
  const [buyer, seller, inspector, lender] = await hre.ethers.getSigners();

  //deploy real estate
  const RealEstate = await hre.ethers.getContractFactory('RealEstate');
  const realEstate = await RealEstate.deploy()
  await realEstate.deployed();

  console.log(`Deployed Real Estate Contract t: ${realEstate.address}`)
  console.log('Minting 3 properties...');

  for (let index = 1; index <= 3; index++) {
    const transaction = await realEstate.connect(seller).mint(`https://ipfs.io/ipfs/QmQUozrHLAusXDxrvsESJ3PYB3rUeUuBAvVWw6nop2uu7c/${index}.png`);
    await transaction.wait()
  }

  //Deploy Escrow
  const Escrow = await hre.ethers.getContractFactory('Escrow')
  const escrow = await Escrow.deploy(
    realEstate.address,
    seller.address,
    inspector.address,
    lender.address
  );
  await escrow.deployed()

  for (let index = 0; index < 3; index++) {
    // Approve properties ....
    let transaction = await realEstate.connect(seller).approve(escrow.address, index + 1);
    await transaction.wait();

  }


  console.log(`Deployed Escrow Estate Contract t: ${escrow.address}`)

  //Listing properties ...
  let transaction = await escrow.connect(seller).list(1, buyer.address, tokens(20), tokens(10))
  await transaction.wait()

  transaction = await escrow.connect(seller).list(2, buyer.address, tokens(15), tokens(5))
  await transaction.wait()

  transaction = await escrow.connect(seller).list(3, buyer.address, tokens(10), tokens(5))
  await transaction.wait()

  console.log("Finished .");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
