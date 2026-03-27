import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase credentials missing in .env");
}

export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder"
);

/**
 * @typedef {Object} SupabaseResponse
 * @property {any} data - The returned data
 * @property {any} error - Any error encountered
 */

/**
 * Compatibility & Service Layer for Database Entities
 */
class EntityService {
  constructor(table) {
    this.table = table;
  }

  /**
   * Filters and retrieves data from Supabase
   * @param {Object} params - Equality filters
   * @param {string} [order] - Column to order by (prepend - for DESC)
   * @param {number} [limit] - Max records
   */
  async filter(params = {}, order = null, limit = null) {
    let query = supabase.from(this.table).select();

    for (const [key, val] of Object.entries(params)) {
      query = query.eq(key, val);
    }

    if (order) {
      const isDesc = order.startsWith("-");
      const column = isDesc ? order.substring(1) : order;
      query = query.order(column, { ascending: !isDesc });
    }

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;
    if (error) {
      console.error(`[Service Error] Filter ${this.table}:`, error);
      throw error;
    }
    return data || [];
  }

  async list() {
    return this.filter();
  }

  async create(payload) {
    const { data, error } = await supabase.from(this.table).insert([payload]).select().single();
    if (error) {
      console.error(`[Service Error] Create ${this.table}:`, error);
      throw error;
    }
    return data;
  }

  async update(id, payload) {
    const { data, error } = await supabase.from(this.table).update(payload).eq("id", id).select().single();
    if (error) {
      console.error(`[Service Error] Update ${this.table}:`, error);
      throw error;
    }
    return data;
  }

  async delete(id) {
    const { error } = await supabase.from(this.table).delete().eq("id", id);
    if (error) {
      console.error(`[Service Error] Delete ${this.table}:`, error);
      throw error;
    }
    return true;
  }
}

/**
 * Global API Object mimicking Base44 surface area but powered by Supabase
 */
export const base44 = {
  auth: {
    me: async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) return null;


      // Fetch profile from public.users table (try ID first, then Email)
      let { data: profile, error: profileError } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (!profile || profileError) {
        let { data: profileByEmail, error: emailError } = await supabase
          .from("users")
          .select("*")
          .eq("email", user.email)
          .maybeSingle();
        
        if (profileByEmail && !emailError) {
          profile = profileByEmail;
          // Optionally update the ID to match auth
          await supabase.from("users").update({ id: user.id }).eq("email", user.email);
        } else {
          // Profile doesn't exist, create it
          const { data: newProfile, error: insertError } = await supabase
            .from("users")
            .insert([{
              id: user.id,
              email: user.email,
              full_name: user.user_metadata?.full_name || user.email.split('@')[0],
              role: user.email === 'admin@fairwayimpact.com' ? 'admin' : 'user'
            }])
            .select()
            .single();

          if (!insertError && newProfile) {
            profile = newProfile;
          }
        }
      }

      const normalizeRole = (roleValue) => {
        if (!roleValue || typeof roleValue !== 'string') return 'user';
        return roleValue.trim().toLowerCase();
      };

      let effectiveRole = normalizeRole(profile?.role);
      if (user.email === 'admin@fairwayimpact.com') {
        effectiveRole = 'admin';

        if (profile && profile.role !== 'admin') {
          await supabase.from("users").update({ role: 'admin' }).eq("id", user.id);
          profile.role = 'admin';
        }
      }

      if (!profile) {
        console.warn("[Auth] Profile not found in public.users, using auth metadata.");
        return {
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || "User",
          role: effectiveRole,
        };
      }

      return {
        ...profile,
        role: normalizeRole(profile.role),
      };
    },
    signIn: async (email, password) => {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return data.user;
    },
    signUp: async (email, password, metadata = {}) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: metadata }
      });
      if (error) throw error;
      
      return data.user;
    },
    logout: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) console.error("[Auth] Logout failed:", error);
      window.location.href = "/";
    },
    redirectToLogin: (returnTo = "/") => {
      const baseUrl = window.location.origin;
      window.location.href = `${baseUrl}/login?returnTo=${encodeURIComponent(returnTo)}`;
    },
    updateMe: async (payload) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("users")
        .update(payload)
        .eq("id", user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
  },
  entities: {
    Charity: new EntityService("Charity"),
    Draw: new EntityService("Draw"),
    Subscription: new EntityService("Subscription"),
    Score: new EntityService("Score"),
    Winner: new EntityService("Winner"),
    UserCharity: new EntityService("UserCharity"),
    DrawResult: new EntityService("DrawResult"),
    User: new EntityService("users"),
  },
  integrations: {
    Core: {
      UploadFile: async ({ file }) => {
        const fileExt = file.name.split(".").pop();
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `uploads/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("core")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("core")
          .getPublicUrl(filePath);

        return { file_url: publicUrl };
      },
    },
  },
};
