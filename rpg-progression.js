// Matches public.rpg_level_for_xp. XP and reward grants remain server-owned.
export const LEVEL_NEEDS=Object.freeze([50,60,70,80,90,90,95,95,100,100,100,105,105,110,110,110,115,115,120,120,125,125,130,130,135,135,140,145,150]);
export const LEVEL_TOTALS=Object.freeze(LEVEL_NEEDS.reduce((totals,need)=>[...totals,totals.at(-1)+need],[0]));
export const LEVEL_GIFTS=Object.freeze([5,10,15,20,25,30]);
export function levelInfo(value){
 const raw=Number(value),xp=Number.isFinite(raw)?Math.max(0,Math.floor(raw)):0;
 let level=1;
 for(let i=1;i<LEVEL_TOTALS.length;i++)if(xp>=LEVEL_TOTALS[i])level=i+1;
 const start=LEVEL_TOTALS[level-1],next=LEVEL_TOTALS[level]??null,cur=xp-start,need=next===null?0:next-start;
 return {level,cur,need,pct:next===null?100:Math.min(100,Math.round(cur/need*100)),max:next===null};
}
export function experienceUntil(xp,level){
 const target=LEVEL_TOTALS[level-1];
 if(target===undefined)return null;
 const value=Number(xp);
 return Math.max(0,target-(Number.isFinite(value)?Math.max(0,Math.floor(value)):0));
}
