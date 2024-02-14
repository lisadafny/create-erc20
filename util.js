const btnName = $("#inputTokenName");
const btnSymbol = $("#inputTokenSymbol");
const btnDecimals = $("#inputDecimals");
let signer = null;
let provider;
let factory;
let contract;

async function start() {
    if (window.ethereum == null) {
        console.log("MetaMask not installed");
        provider = ethers.getDefaultProvider();

    } else {
        provider = new ethers.BrowserProvider(window.ethereum);
        signer = await provider.getSigner();
        factory = new ethers.ContractFactory(abi, bytecode, signer);
    }
    $("#formContract").on('submit', deploy);
}
async function deploy(event){
    event.preventDefault();
    const name = btnName.val();
    const symbol = btnSymbol.val();
    const decimals = btnDecimals.val();

    contract = await factory.deploy(name, symbol, decimals);

    console.log("contract address: ", contract.target)

    await contract.waitForDeployment();
}
start();