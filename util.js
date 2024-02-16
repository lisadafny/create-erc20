let signer = null;
let provider;
let factory;
let contract;
let funcContract;

async function start() {
    if (window.ethereum == null) {
        console.log("MetaMask not installed");
        provider = ethers.getDefaultProvider();
        $("#sectionCreateContract").addClass("d-none");
        return;
    }

    provider = new ethers.BrowserProvider(window.ethereum);
    signer = await provider.getSigner();
    factory = new ethers.ContractFactory(abi, bytecode, signer);
    $("#navAddress").html("Welcome " + signer.address);

    $("#formContract").on('submit', deploy);
    $("#formAction").on('submit', callContract);
    $(".contract-action").on('click', changeToContractCallingSection);

}

async function deploy(event) {
    try {
        event.preventDefault();
        const name = $("#inputTokenName").val();
        const symbol = $("#inputTokenSymbol").val();
        const decimals = $("#inputDecimals").val();

        contract = await factory.deploy(name, symbol, decimals);

        console.log("contract address: ", contract.target)

        await contract.waitForDeployment();

        $("#sectionCreateContract").addClass("d-none");
        $("#sectionContractInfo").removeClass("d-none");

        $("#contractHash").html(contract.target);
    } catch (error) {
        $("#modalInfo").modal("show");
        if (error.reason) {
            $(".modal-title").html("Error: " + error.reason);
        }
        if (error.shortMessage) {
            $(".modal-body p").html(error.shortMessage);
            return;
        }
        $(".modal-body p").html(error);
    }
}

function changeToContractCallingSection(event) {
    $("#contractCalling h2").html(event.currentTarget.innerHTML);
    $("#contractCalling").removeClass("d-none");

}

async function callContract(event) {
    try {
        event.preventDefault();
        const addressValue = $("#inputAddress").val();
        const amountValue = $("#inputAmount").val();

        if (!contract || !addressValue || !amountValue) {
            $("#modalInfo").modal("show");
            return;
        }

        let funcTxt = $(".btn-check:checked")[0].id;
        funcContract = await contract.getFunction(funcTxt);

        const tx = await funcContract.send(addressValue, amountValue);

        const txReceipt = await tx.wait();
        console.log("txReceipt: ", txReceipt);
    } catch (error) {
        $("#modalInfo").modal("show");
        if (error.reason) {
            $(".modal-title").html("Error: " + error.reason);
        }
        if (error.shortMessage) {
            $(".modal-body p").html(error.shortMessage);
            return;
        }
        $(".modal-body p").html(error);
    }
}

start();