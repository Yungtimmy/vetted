const test=require('node:test'),assert=require('node:assert');
const ganache=require('ganache'),{ethers}=require('ethers');
const art=require('../build/ScoreRegistry.json');
const V1=ethers.id('validator-1'),V2=ethers.id('validator-2');
const A=65,B=66,C=67,D=68,F=70;
let provider,owner,pub,stranger,reg;
const ev=async tx=>{const r=await tx.wait();assert.equal(r.logs.length,1);return reg.interface.parseLog(r.logs[0]);};
test.before(async()=>{
  provider=new ethers.BrowserProvider(ganache.provider({logging:{quiet:true},chain:{hardfork:'merge'}}));
  [owner,pub,stranger]=await Promise.all([0,1,2].map(i=>provider.getSigner(i)));
  reg=await new ethers.ContractFactory(art.abi,art.bytecode,owner).deploy(); await reg.waitForDeployment();
  assert.equal(await reg.owner(),await owner.getAddress());
});
test('publish emits full ScorePublished',async()=>{
  const e=await ev(await reg.publish(V1,1284,88,A));
  assert.equal(e.name,'ScorePublished'); assert.equal(e.args.validator,V1);
  assert.equal(e.args.era,1284n); assert.equal(e.args.score,88n); assert.equal(e.args.grade,65n);
  assert.equal(e.topic,ethers.id('ScorePublished(bytes32,uint256,uint256,uint256)'));
});
test('grade bands and other eras',async()=>{
  for(const [era,s,g] of [[1,100,A],[2,85,A],[3,84,B],[4,65,B],[5,64,C],[6,50,C],[7,49,D],[8,30,D],[9,29,F],[10,0,F]])
    assert.equal((await ev(await reg.publish(V2,era,s,g))).args.score,BigInt(s));
  const logs=await reg.queryFilter(reg.filters.ScorePublished(V2)); assert.equal(logs.length,10);
});
test('rejects bad inputs',async()=>{
  await assert.rejects(reg.publish.staticCall(V1,1,101,A));
  await assert.rejects(reg.publish.staticCall(V1,1,90,B));
  await assert.rejects(reg.publish.staticCall(V1,1284,88,A)); // duplicate era
  await assert.rejects(reg.publish.staticCall(V1,0,50,C));   // era 0
});
test('roles',async()=>{
  await assert.rejects(reg.connect(stranger).publish.staticCall(V1,5,10,F));
  await assert.rejects(reg.connect(stranger).setPublisher.staticCall(await stranger.getAddress()));
  await (await reg.setPublisher(await pub.getAddress())).wait();
  assert.equal(await reg.publisher(),await pub.getAddress());
  assert.equal((await ev(await reg.connect(pub).publish(V1,5,10,F))).args.grade,70n);
  await (await reg.setPublisher(ethers.ZeroAddress)).wait();
  await assert.rejects(reg.connect(pub).publish.staticCall(V1,6,50,C));
});
