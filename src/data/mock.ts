import type {Product,Tank} from '../types';
export const products:Product[]=[
{id:'1',name:'HSD - Diesel',price:93.53,qty:11036.92,value:1032283.13,type:'Fuel'},
{id:'2',name:'MS - Petrol',price:103.26,qty:3900.80,value:402796.60,type:'Fuel'},
{id:'3',name:'Power - Petrol',price:112.87,qty:54.40,value:6140.13,type:'Fuel'}];
export const tanks:Tank[]=[
{name:'HSD Tank 2',product:'HSD',capacity:22000,min:500,available:6322.83,percent:28.74},
{name:'HSD Tank 5',product:'HSD',capacity:35000,min:500,available:26644.66,percent:76.16},
{name:'MS Tank 1',product:'MS',capacity:16000,min:500,available:7618.35,percent:47.61},
{name:'MS Tank 3',product:'MS',capacity:16000,min:500,available:6311.04,percent:39.44},
{name:'Power Tank 4',product:'Power',capacity:9000,min:500,available:7641.36,percent:84.89}];
export const oilProducts=[{name:'2T Oil',price:300,stock:51},{name:'20/40 - 1/2 Lit',price:150,stock:36},{name:'Milcy - 1 Lit',price:350,stock:47},{name:'Skutex',price:320,stock:35},{name:'Distilled Water',price:25,stock:60}];
export const customers=[['SRM Quarry','9876543210','₹0','₹17,09,912.41','Over Due'],['Vetri','9876501111','₹0','₹10,26,390.26','Over Due'],['Sekar MTA','9876502222','₹0','₹9,18,039.39','Over Due'],['Abirami Transport','9876503333','₹32,650','₹20,547.99','Partial']];
export const recent=[['06:12 PM','Cash','Walk-in','₹2,500'],['05:48 PM','Credit','SRM Quarry','₹15,000'],['05:20 PM','Cash','Walk-in','₹1,000'],['04:42 PM','Oil','Walk-in','₹2,220']];
