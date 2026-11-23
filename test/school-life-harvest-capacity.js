// This is the existing server per-kind stock ceiling, not a new bag-slot limit.
const LIMIT=999999;
export function harvestCapacity(snapshot,index){
 const plant=snapshot?.plants?.[index],stock=snapshot?.inventory?.find(x=>x.kind===plant?.kind);
 if(snapshot?.status!=='ready'||!snapshot.enrolled||!plant||plant.stage!==3||!stock)return {ready:false,fits:false,items:false,seeds:false};
 const items=Number(stock.flowers),seeds=Number(stock.seeds),yi=plant.yield_items,ys=plant.yield_seeds;
 if(![items,seeds,yi,ys].every(Number.isSafeInteger)||items<0||items>LIMIT||seeds<0||seeds>LIMIT||yi<1||yi>LIMIT||ys<0||ys>LIMIT)return {ready:false,fits:false,items:false,seeds:false};
 const fullItems=items+yi>LIMIT,fullSeeds=seeds+ys>LIMIT;
 return {ready:true,fits:!fullItems&&!fullSeeds,items:fullItems,seeds:fullSeeds};
}
