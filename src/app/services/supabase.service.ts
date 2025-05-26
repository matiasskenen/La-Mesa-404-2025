import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js'

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  supabase: SupabaseClient<any, "public", any>;

  constructor() {
    this.supabase = createClient("https://gnftqcqggcezpvztlcot.supabase.co",
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImduZnRxY3FnZ2NlenB2enRsY290Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgyOTI4MjQsImV4cCI6MjA2Mzg2ODgyNH0.eTqaX15HvADwu_aOeK2-gt5xyZx_vEsVbyOsXcEFwzk")
   }
}
