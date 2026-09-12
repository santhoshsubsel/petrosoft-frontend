import {create} from 'zustand';
import type {Role,User} from '../types';
interface AuthState { user:User; setRole:(role:Role)=>void; logout:()=>void; }
export const useAuthStore=create<AuthState>((set)=>({user:{name:'Nallathur Admin',email:'admin@petrosoft.local',role:'ADMIN'},setRole:(role)=>set({user:role==='ADMIN'?{name:'Nallathur Admin',email:'admin@petrosoft.local',role}:{name:'Manager',email:'manager@petrosoft.local',role}}),logout:()=>set({user:{name:'',email:'',role:'ADMIN'}})}));
