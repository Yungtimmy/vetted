const {ethers}=require('ethers'),fs=require('fs');
const abi=JSON.parse(fs.readFileSync(__dirname+'/../build/ScoreRegistry.abi.json'));
const i=new ethers.Interface(abi);
// Alice's dev account id (SS58 5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY) as bytes32
const validator='0xd43593c715fdd31c61141abd04a99fd6822c8558854ccde39a5684e7a56da27d';
const args=[validator,1284,88,65]; // era 1284, score 88, grade 65 = 'A'
const calldata=i.encodeFunctionData('publish',args);
const out={function:'publish(bytes32,uint256,uint256,uint256)',args:{validator,era:1284,score:88,grade:"65 (ASCII 'A')"},calldata,constructorArgs:'none (owner = msg.sender)'};
fs.writeFileSync(__dirname+'/../build/sample-publish.json',JSON.stringify(out,null,2));console.log(JSON.stringify(out,null,2));
