// userMemory.js
class UserMemoryService {
  constructor() {
    this.storageKey = "chatfit-user-memories";
  }

  /* -------------------------------------------------------------
   * BASE STORAGE HELPERS
   * ------------------------------------------------------------- */

  getAllMemories() {
    try {
      const json = localStorage.getItem(this.storageKey);
      return json ? JSON.parse(json) : {};
    } catch (err) {
      console.error("Error reading user memories:", err);
      return {};
    }
  }

  saveAllMemories(memories) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(memories));
      return true;
    } catch (err) {
      console.error("Error saving memories:", err);
      return false;
    }
  }

  /* -------------------------------------------------------------
   * MAIN USER MEMORY RETRIEVAL
   * ------------------------------------------------------------- */

  getUserMemory(userId) {
    const all = this.getAllMemories();

    // If user memory missing → automatically create new
    if (!all[userId]) {
      const fresh = this.createDefaultMemory(userId);
      all[userId] = fresh;
      this.saveAllMemories(all);
      return fresh;
    }

    return all[userId];
  }

  /* -------------------------------------------------------------
   * DEFAULT USER MEMORY STRUCT
   * ------------------------------------------------------------- */

  createDefaultMemory(userId, userName = "") {
    return {
      userId,
      userName,
      firstLogin: new Date().toISOString(),
      lastLogin: new Date().toISOString(),

      // User engagement stats
      totalOrders: 0,
      totalCartAdds: 0,

      // RULE 5: Cart items for persistence
      cartItems: [],

      // Product history
      favoriteCategories: [],
      recentProducts: [],

      // Chat memory (only last 10 messages)
      chatHistory: [],

      // RULE 1: Conversation memory to prevent hallucinations
      conversationContext: {
        previouslyMentionedProducts: [],
        currentCategory: null,
        lastUserIntent: null,
        // lastUserQuery and lastBotResponse maintained here for session/context
        lastUserQuery: null,
        lastBotResponse: null,
        lastUpdated: null
      },

      // Preference model
      preferences: {
        priceRange: "medium",
        likesElectronics: false,
        likesFashion: false,
      },

      // Greeting logic
      isNewUser: true,
    };
  }

  /* -------------------------------------------------------------
   * CART MANAGEMENT (RULE 5)
   * ------------------------------------------------------------- */

  updateCartItem(userId, product, action) {
    const memory = this.getUserMemory(userId);
    let cartItems = memory.cartItems || [];

    if (action === 'add') {
      const qtyToAdd = product.quantity && Number.isInteger(product.quantity) && product.quantity > 0
        ? product.quantity
        : 1;

      const existingItem = cartItems.find(item => item.id === product.id);
      if (existingItem) {
        existingItem.quantity = (existingItem.quantity || 1) + qtyToAdd;
        existingItem.addedAt = new Date().toISOString();
      } else {
        cartItems.push({
          id: product.id,
          title: product.title,
          price: product.priceINR ?? product.price ?? 0,
          category: product.category,
          quantity: qtyToAdd,
          addedAt: new Date().toISOString(),
          addedViaChatbot: !!product.addedViaChatbot // preserve if provided
        });
      }
    } else if (action === 'remove') {
      cartItems = cartItems.filter(item => item.id !== product.id);
    } else if (action === 'update') {
      const existingItem = cartItems.find(item => item.id === product.id);
      if (existingItem) {
        existingItem.quantity = product.quantity;
      }
    }

    return this.updateUserMemory(userId, { cartItems });
  }

  // RULE 5.1 & 5.2: Get products added via chatbot vs manually
  getChatbotAddedItems(userId) {
    const memory = this.getUserMemory(userId);
    return memory.cartItems?.filter(item => item.addedViaChatbot) || [];
  }

  getManuallyAddedItems(userId) {
    const memory = this.getUserMemory(userId);
    return memory.cartItems?.filter(item => !item.addedViaChatbot) || [];
  }

  /* -------------------------------------------------------------
   * CONVERSATION MEMORY (RULE 1)
   * ------------------------------------------------------------- */

  updateConversationContext(userId, updates) {
    const memory = this.getUserMemory(userId);
    const currentContext = memory.conversationContext || {};

    const updatedContext = {
      ...currentContext,
      ...updates,
      lastUpdated: new Date().toISOString()
    };

    return this.updateUserMemory(userId, {
      conversationContext: updatedContext
    });
  }

  // RULE 1: Track mentioned products to prevent hallucinations
  addMentionedProduct(userId, product) {
    const memory = this.getUserMemory(userId);
    const mentionedProducts = memory.conversationContext?.previouslyMentionedProducts || [];

    // Avoid duplicates and keep only last 10
    const updatedMentioned = [
      ...mentionedProducts.filter(p => p.id !== product.id),
      {
        id: product.id,
        title: product.title,
        category: product.category
      }
    ].slice(-10);

    return this.updateConversationContext(userId, {
      previouslyMentionedProducts: updatedMentioned
    });
  }

  // Convenience: set last exchange for session context (last user query + last bot response)
  setLastExchange(userId, lastUserQuery, lastBotResponse) {
    return this.updateConversationContext(userId, {
      lastUserQuery,
      lastBotResponse
    });
  }

  /* -------------------------------------------------------------
   * SAVE SINGLE USER
   * ------------------------------------------------------------- */

  saveMemory(userId, memory) {
    const all = this.getAllMemories();
    all[userId] = memory;

    return this.saveAllMemories(all);
  }

  /* -------------------------------------------------------------
   * UPDATE USER MEMORY (CENTRALIZED MERGER)
   * ------------------------------------------------------------- */

  updateUserMemory(userId, updates) {
    const current = this.getUserMemory(userId);

    const updated = {
      ...current,
      ...updates,
      lastLogin: new Date().toISOString(),
      isNewUser: false,
    };

    this.saveMemory(userId, updated);
    return updated;
  }

  /* -------------------------------------------------------------
   * SET USER NAME (for first-time users)
   * ------------------------------------------------------------- */

  setUserName(userId, userName) {
    const mem = this.getUserMemory(userId);

    // Only update if missing or changed
    if (!mem.userName || mem.userName !== userName) {
      return this.updateUserMemory(userId, {
        userName,
        isNewUser: true, // ensures first-time greeting works
      });
    }

    return mem;
  }

  /* -------------------------------------------------------------
   * PERSONALIZED GREETING LOGIC
   * ------------------------------------------------------------- */

  getPersonalizedGreeting(userId, userName) {
    const memory = this.getUserMemory(userId);

    const now = new Date();
    const hour = now.getHours();

    let greeting =
      hour < 12
        ? "Good morning"
        : hour < 17
        ? "Good afternoon"
        : "Good evening";

    /* ---------------------------
     * FIRST TIME USER
     * --------------------------- */
    if (memory.isNewUser || memory.totalOrders === 0) {
      return `${greeting}, ${userName}! 👋 I'm ChatFit, your personal shopping assistant. Let's find the perfect product for you today!`;
    }

    /* ---------------------------
     * RETURNING USER
     * --------------------------- */
    const lastVisit = new Date(memory.lastLogin);
    const daysSinceVisit = Math.floor(
      (now - lastVisit) / (1000 * 60 * 60 * 24)
    );

    let context = "";

    if (daysSinceVisit > 7) {
      context = `Welcome back, ${userName}! It's been a while. `;
    } else {
      context = `Welcome back, ${userName}! `;
    }

    // Personal touches
    const personal = [];

    if (memory.totalCartAdds > 0)
      personal.push(`you previously added ${memory.totalCartAdds} items to cart`);

    if (memory.favoriteCategories?.length > 0)
      personal.push(`you seem to like ${memory.favoriteCategories[0].name}`);

    if (memory.recentProducts?.length > 0)
      personal.push(`you checked out ${memory.recentProducts[0].title} last time`);

    const memoryNote =
      personal.length > 0
        ? ` I remember ${personal.join(" and ")}.` : "";

    return `${greeting}, ${userName}! 👋 ${context}I'm here to help you continue exploring great products.${memoryNote}`;
  }

  /* -------------------------------------------------------------
   * CHAT MEMORY (last 10 messages)
   * ------------------------------------------------------------- */

  addChatHistory(userId, message, response) {
    const mem = this.getUserMemory(userId);

    const entry = {
      timestamp: new Date().toISOString(),
      userMessage: message,
      botResponse: response,
    };

    const trimmed = [...(mem.chatHistory || []), entry].slice(-10);

    return this.updateUserMemory(userId, { chatHistory: trimmed });
  }

  /* -------------------------------------------------------------
   * PRODUCT INTERACTION MEMORY
   * ------------------------------------------------------------- */

  recordProductInteraction(userId, product, action) {
    const mem = this.getUserMemory(userId);
    const updates = {};

    /* -------- CART ADDS -------- */
    if (action === "cart_add") {
      updates.totalCartAdds = (mem.totalCartAdds || 0) + 1;

      const recent = mem.recentProducts || [];

      if (!recent.find((p) => p.id === product.id)) {
        updates.recentProducts = [
          {
            id: product.id,
            title: product.title,
            category: product.category,
          },
          ...recent.slice(0, 4),
        ];
      }
    }

    /* -------- ORDERS -------- */
    if (action === "order") {
      updates.totalOrders = (mem.totalOrders || 0) + 1;
    }

    /* -------- CATEGORY MEMORY -------- */
    if (product && product.category) {
      const fav = mem.favoriteCategories || [];
      const idx = fav.findIndex((c) => c.name === product.category);

      if (idx > -1) {
        fav[idx].count++;
      } else {
        fav.push({ name: product.category, count: 1 });
      }

      updates.favoriteCategories = fav.sort((a, b) => b.count - a.count);
    }

    return this.updateUserMemory(userId, updates);
  }
}

export default new UserMemoryService();
