const { expect } = require('chai');
const { ethers } = require('hardhat');

const tokens = (n) => {
    return ethers.utils.parseUnits(n.toString(), 'ether')
}

const nftAddress = "https://ipfs.io/ipfs/QmQUozrHLAusXDxrvsESJ3PYB3rUeUuBAvVWw6nop2uu7c/2.png"

describe('Escrow', () => {
    let buyer, seller, inspector, lender
    let realEstate, escrow

    beforeEach(async () => {
        [buyer, seller, inspector, lender] = await ethers.getSigners();

        // NFT
        // deploy real estate
        const RealEstate = await ethers.getContractFactory('RealEstate');
        realEstate = await RealEstate.deploy();

        // mint
        let transaction = await realEstate.connect(seller).mint(nftAddress)
        await transaction.wait()

        const Escrow = await ethers.getContractFactory('Escrow')
        escrow = await Escrow.deploy(realEstate.address, seller.address, inspector.address, lender.address)

        //approve property
        transaction = await realEstate.connect(seller).approve(escrow.address, 1)
        await transaction.wait()

        // List property
        transaction = await escrow.connect(seller).list(1)
        await transaction.wait()

    })

    describe('deployment', () => {
        it('returns NFT address', async () => {
            const result = await escrow.nftAddress();
            expect(result).to.be.equal(realEstate.address);
        })

        it('returns seller', async () => {
            const result = await escrow.seller();
            expect(result).to.be.equal(seller.address);
        })

        it('returns lender', async () => {
            const result = await escrow.inspector();
            expect(result).to.be.equal(inspector.address);
        })

        it('returns inspector', async () => {
            const result = await escrow.lender();
            expect(result).to.be.equal(lender.address);
        })
    })

    describe('Listing', () => {
        it('Update ownership', async () => {
            expect(await realEstate.ownerOf(1)).to.be.equal(escrow.address)
        })
    })



})
