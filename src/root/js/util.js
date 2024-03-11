const formCreateContract = $("#formContract");
const formCallContract = $("#formAction");
const notification = $(".toast");
let signer = null;
let provider;
let factory;
let contract;
let symbol;

async function start() {
    if (window.ethereum == null) {
        console.log("MetaMask not installed");
        provider = ethers.getDefaultProvider();
        return;
    }
    if(!window.ethereum.isMetaMask){
        console.log("User not using MetaMask");
        provider = ethers.getDefaultProvider();
        return;
    }
    setProviderFromMetamask();
    setSignerFromMetamask();

    formCreateContract.on('submit', deploy);
    formCallContract.on('submit', callContract);
    $(".contract-action").on('click', changeToContractCallingSection);

    $("#sectionCreateContract").removeClass("d-none");

    window.ethereum.on('accountsChanged', updateSigner);
    window.ethereum.on("chainChanged", updateProvider);
}

async function deploy(event) {
    event.preventDefault();
    const loadingAnimation = $("#loadFormContract");
    const name = $("#inputTokenName").val();
    const decimals = $("#inputDecimals").val();
    symbol = $("#inputTokenSymbol").val();
    try {
        formCreateContract.addClass("opacity-25");
        loadingAnimation.removeClass("d-none");

        contract = await factory.deploy(name, symbol, decimals);

        await contract.waitForDeployment();

        loadingAnimation.addClass("d-none");

        showMessage("Your contract is ready!<br>Contract address: " + contract.target)

        $("#sectionCreateContract").addClass("d-none");
        $("#sectionContractInfo").removeClass("d-none");

        $("#contractHash").html(contract.target);
    } catch (error) {
        formCreateContract[0].reset();
        loadingAnimation.addClass("d-none");
        formCreateContract.removeClass("opacity-25");

        openModalError(error);
    }
}

function changeToContractCallingSection(event) {
    $("#contractCalling h2").html(event.currentTarget.innerHTML);
    $("#contractCalling").removeClass("d-none");

}

async function callContract(event) {
    event.preventDefault();
    const loadingAnimation = $("#loadFormAction");
    const addressValue = $("#inputAddress").val();
    const amountValue = $("#inputAmount").val();
    try {
        formCallContract.addClass("opacity-25");
        loadingAnimation.removeClass("d-none");
        if (!contract || !addressValue || !amountValue) {
            $("#modalInfo").modal("show");
            return;
        }

        let funcTxt = $(".btn-check:checked")[0].id;
        let funcContract = await contract.getFunction(funcTxt);

        const tx = await funcContract.send(addressValue, amountValue);

        const txReceipt = await tx.wait();
        loadingAnimation.addClass("d-none");
        formCallContract.removeClass("opacity-25");
        console.log("txReceipt: ", txReceipt);
        showMessage(funcTxt + " successful! <br>Tx hash: " + txReceipt.hash)
    } catch (error) {
        loadingAnimation.addClass("d-none");
        formCallContract.removeClass("opacity-25");

        openModalError(error);
    }

    updateBalance();

}

function showMessage(string) {
    $(".toast-body").html(string);
    notification.toast("show");
}

start();

async function updateBalance(tokenSymbol = symbol) {
    $("#balanceInfo").addClass("d-none");
    try {
        let balance = await contract.balanceOf(signer.address);
        $("#tokenBalance").html(balance);

        if (!tokenSymbol) {
            symbol = await contract.symbol();
            $("#tokenSymbol").html(symbol);
        }
        else {
            symbol = tokenSymbol;
            $("#tokenSymbol").html(tokenSymbol);
        }

        //showMessage("balance of token " + symbol + " updated!");
        $("#balanceInfo").removeClass("d-none");

    } catch (error) {
        $("#balanceInfo").addClass("d-none");

        openModalError(error);
    }
}

function openModalError(error) {
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

async function setSignerFromMetamask(){

    signer = await provider.getSigner();
    factory = new ethers.ContractFactory(abi, bytecode, signer);

    $("#navTitle").html("Welcome " + signer.address);
    let network = await provider.getNetwork();
    $("#navSubtitle").html("Connected on " + network.name.toUpperCase());
}

async function setProviderFromMetamask(){
    provider = new ethers.BrowserProvider(window.ethereum);
}

function updateSigner(){
    
    if (contract) {
        showMessage("We noticed you changed your account, some features may become unavailable.<br>" +
            "Keep in mind that the contract owner is: " + signer.address + "<br>");
        updateBalance();
    };
    setSignerFromMetamask();
}

function updateProvider(){
    setProviderFromMetamask();
    setSignerFromMetamask();
}