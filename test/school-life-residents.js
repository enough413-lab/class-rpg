// Facility use is a view of the existing completed projects, never saved progress.
export function residentUse(state,repairing=null){
 const settled=state?.opening?.legacy||state?.opening?.step>=7;
 const completed=id=>settled&&state.projects.includes(id)&&repairing?.id!==id;
 return {
  saessak:completed('bench')?{activity:'bench',x:986,y:580,depth:596,w:57,h:102,target:{x:997,y:616}}:null,
  tori:completed('library')?{activity:'reading',x:1097,y:803,depth:801,w:75,h:100,target:{x:1097,y:824}}:null
 };
}
