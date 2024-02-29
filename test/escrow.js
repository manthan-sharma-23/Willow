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
        //random signers
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
        transaction = await escrow.connect(seller).list(1, buyer.address, tokens(10), tokens(5))
        await transaction.wait()

    })

    describe('Deployment', () => {
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
        it('update ownership', async () => {
            expect(await realEstate.ownerOf(1)).to.be.equal(escrow.address)
        })
        it('update as listed', async () => {
            const result = await escrow.isListed(1);
            expect(result).to.be.equal(true)
        })
        it('returns buyer', async () => {
            const result = await escrow.buyer(1);
            expect(result).to.be.equal(buyer.address)
        })
        it('returns buyer', async () => {
            const result = await escrow.purchasePrice(1);
            expect(result).to.be.equal(tokens(10))
        })
        it('returns buyer', async () => {
            const result = await escrow.escrowAmount(1);
            expect(result).to.be.equal(tokens(5))
        })
    })

    describe('Deposits', () => {
        it('update contract balance', async () => {
            const transaction = await escrow.connect(buyer).depositEarnest(1, { value: tokens(5) });
            await transaction.wait();
            const result = await escrow.getBalance();
            expect(result).to.be.equal(tokens(5))
        })
    })
    describe('Inspection', () => {
        it('update inspection status', async () => {
            const transaction = await escrow.connect(inspector).updateInspectionStatus(1, true);
            await transaction.wait()
            const result = await escrow.inspectionPassed(1);
            expect(result).to.be.equal(true)
        })
    })
    describe('Approval', () => {
        beforeEach(async () => {
            let transaction = await escrow.connect(buyer).approveSale(1)
            await transaction.wait()

            transaction = await escrow.connect(seller).approveSale(1)
            await transaction.wait()

            transaction = await escrow.connect(lender).approveSale(1)
            await transaction.wait()
        })

        it('Updates approval status', async () => {
            expect(await escrow.approval(1, buyer.address)).to.be.equal(true)
            expect(await escrow.approval(1, seller.address)).to.be.equal(true)
            expect(await escrow.approval(1, lender.address)).to.be.equal(true)
        })
    })
    describe('Sale', async () => {
        beforeEach(async () => {
            let transaction = await escrow.connect(buyer).depositEarnest(1, { value: tokens(5) });
            await transaction.wait()

            transaction = await escrow.connect(inspector).updateInspectionStatus(1, true);
            await transaction.wait()

            transaction = await escrow.connect(buyer).approveSale(1);
            await transaction.wait()

            transaction = await escrow.connect(seller).approveSale(1);
            await transaction.wait()

            transaction = await escrow.connect(lender).approveSale(1);
            await transaction.wait()

            await lender.sendTransaction({ to: escrow.address, value: tokens(5) });

            transaction = await escrow.connect(seller).finalizeSale(1)
            await transaction.wait()
        })

        it('updates ownership', async () => {
            expect(await realEstate.ownerOf(1)).to.be.equal(buyer.address);
        })

        it('updates balance', async () => {
            expect(await escrow.getBalance()).to.be.equal(0);
        })
    })


})
