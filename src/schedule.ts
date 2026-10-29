export const distributionTime='10:00 AM – 12:00 PM';
export type Distribution={month:string;slot:number;date:string;time:string};
export function localDay(now:number,timeZone:string){
 const parts=new Intl.DateTimeFormat('en-CA',{timeZone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
 const part=(key:string)=>parts.find(p=>p.type===key)!.value;return `${part('year')}-${part('month')}-${part('day')}`;
}
export function distributionCutoff(date:string,timeZone='Africa/Lagos'){
 const [y,m,d]=date.split('-').map(Number);const target=Date.UTC(y,m-1,d,12);let instant=target;
 for(let i=0;i<3;i++){
  const parts=new Intl.DateTimeFormat('en-GB',{timeZone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(instant);
  const n=(key:string)=>Number(parts.find(p=>p.type===key)!.value);
  instant+=target-Date.UTC(n('year'),n('month')-1,n('day'),n('hour'),n('minute'),n('second'));
 }return instant;
}
export function availableDistributions(dates:Distribution[],now:number,timeZone='Africa/Lagos'){
 return dates.filter(item=>distributionCutoff(item.date,timeZone)>now).sort((a,b)=>a.date.localeCompare(b.date)).slice(0,1);
}
export function highlightParts(text:string,query:string){
 const needle=query.trim().toLowerCase();if(!needle)return [{text,matched:false}];
 const parts:{text:string;matched:boolean}[]=[];let start=0,index=0;
 while((index=text.toLowerCase().indexOf(needle,start))!==-1){if(index>start)parts.push({text:text.slice(start,index),matched:false});parts.push({text:text.slice(index,index+needle.length),matched:true});start=index+needle.length;}
 if(start<text.length)parts.push({text:text.slice(start),matched:false});return parts;
}
