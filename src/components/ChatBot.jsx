// ChatBot.jsx — Ollama-only, final refined version
import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, X, Minimize2, MessageCircle, User, Trash2, Download } from 'lucide-react';
import ChatFitAvatar from '../assets/ChatFit.png';
import UserMemoryService from '../UserMemories/userMemoryService';

const OLLAMA_ENDPOINT = 'http://localhost:4000/api/ollama/generate'; // server prepends PRODUCT_CATALOG

const ChatBot = ({ products = [], user, onAddToCart, cart = [] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showSuggestedQuestions, setShowSuggestedQuestions] = useState(true);

  const suggestedQuestions = [
    "What electronics do you have?",
    "Show me fashion products",
    "Recommend some top-rated electronics",
    "Suggest something popular right now",
    "Which one has the best rating?",
    "What do you suggest for daily use?"
  ];

  // minimal session context we persist and send to server
  const conversationContextRef = useRef({
    lastUserQuery: null,
    lastBotResponse: null
  });

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    // Load user memory and greeting at mount or when user changes
    if (user && !user.isAdmin) {
      const mem = UserMemoryService.getUserMemory(user.id);
      if (mem && mem.conversationContext) {
        conversationContextRef.current.lastUserQuery = mem.conversationContext.lastUserQuery || null;
        conversationContextRef.current.lastBotResponse = mem.conversationContext.lastBotResponse || null;
      }

      if (messages.length === 0) {
        const greeting = UserMemoryService.getPersonalizedGreeting(user.id, user.name || 'there');
        setMessages([{ role: 'assistant', content: greeting, timestamp: new Date() }]);
        // persist greeting as last exchange (if service supports it)
        if (typeof UserMemoryService.setLastExchange === 'function') {
          UserMemoryService.setLastExchange(user.id, null, greeting);
        }
        // Update persistently
        UserMemoryService.updateConversationContext(user.id, {
          lastUserQuery: conversationContextRef.current.lastUserQuery,
          lastBotResponse: greeting
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [inputMessage]);

  // Utility: map product ids -> product objects (keeps ordering as ids appear)
  const lookupProductsById = useCallback((ids = []) => {
    const idSet = new Set(ids);
    const found = products.filter(p => idSet.has(p.id));
    const ordered = ids.map(id => found.find(f => f.id === id)).filter(Boolean);
    return ordered;
  }, [products]);

  // Call server proxy which attaches PRODUCT_CATALOG and session metadata
  const callOllamaServer = useCallback(async (userMessage) => {
    const lastUserQuery = conversationContextRef.current.lastUserQuery || '';
    const lastBotResponse = conversationContextRef.current.lastBotResponse || '';
    const currentCartIds = (cart || []).map(i => i.id);

    const instructionPrompt = `
You are ChatFit, a precise e-commerce assistant. You MUST respond WITH ONLY a single JSON object and nothing else.
SCHEMA:
{
  "action": "add_to_cart" | "recommend" | "none",
  "product_ids": [],        // array of product ids from PRODUCT_CATALOG
  "quantities": [],         // optional; aligns with product_ids
  "message": "Short human-friendly reply to display to the user"
}

RULES:
1) If the user's message is an explicit ADD request (contains "add", "add to cart", "put", ordinal references like "1st", "2nd", "first", "second"), you MAY return action = "add_to_cart". Otherwise, do NOT return add_to_cart.
2) If returning "add_to_cart", reference products from LAST_BOT_RESPONSE lists (or PRODUCT_CATALOG) and prefer NOT to add items already in CURRENT_CART unless user explicitly asks to increase quantity.
3) If a product is already in CURRENT_CART, update quantity and respond: "Product already in cart. Updating quantity."
4) If returning "recommend", choose up to 4 items from PRODUCT_CATALOG, exclude CURRENT_CART items, order by rating & relevance, and avoid duplicates.
4) If ambiguous, return {"action":"none","product_ids":[],"message":"I couldn't identify which product to add or recommend. Could you clarify?"}
5) Respond ONLY with valid JSON — no extra commentary.
6) Use LAST_USER_QUERY and LAST_BOT_RESPONSE for context but prioritize current message.

SESSION DATA (server attaches):
- CURRENT_CART: ${JSON.stringify(currentCartIds)}
- LAST_USER_QUERY: ${JSON.stringify(lastUserQuery)}
- LAST_BOT_RESPONSE: ${JSON.stringify(lastBotResponse)}

User's message: ${JSON.stringify(userMessage)}
`;

    try {
      console.log("📤 Sending request to server /api/ollama/generate");
      console.log("📦 Cart IDs:", currentCartIds);
      console.log("🧠 Last user query:", lastUserQuery);
      console.log("🤖 Last bot response:", lastBotResponse);
      console.log("📝 Prompt sent to Ollama:\n", instructionPrompt);

      const response = await fetch(OLLAMA_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama3.2',
          prompt: instructionPrompt,
          stream: false,
          options: { temperature: 0.1, top_p: 0.9, max_tokens: 120 },
          useProductContext: true,
          extraContext: {
            current_cart_ids: currentCartIds,
            last_user_query: lastUserQuery,
            last_bot_response: lastBotResponse
          }
        })
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => response.statusText);
        throw new Error(`Server/Ollama error: ${response.status} ${errText}`);
      }

      const data = await response.json();
      const raw = data.response || data.output || data.text || (data?.choices && data.choices[0]?.text) || JSON.stringify(data);
      console.log('⬅️ Ollama raw response:', raw);
      return raw;
    } catch (err) {
      console.error('Error calling Ollama server:', err);
      throw err;
    }
  }, [cart]);

  // Robust JSON extractor: returns parsed object or null
  const extractJSON = (text) => {
    if (!text || typeof text !== 'string') return null;
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end === -1) return null;
    const candidate = text.slice(start, end + 1);
    try {
      return JSON.parse(candidate);
    } catch (e) {
      try {
        const cleaned = candidate.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
        return JSON.parse(cleaned);
      } catch (e2) {
        return null;
      }
    }
  };

  // Main message processing — Ollama-only flow
  const processUserMessage = async (userMessage) => {
    if (!user || user.isAdmin) return;
    setIsLoading(true);
    setError(null);
    setShowSuggestedQuestions(false);

    console.log("➡️ processUserMessage START");
    console.log("🧑 User message:", userMessage);
    console.log("🛒 Current cart:", cart);
    console.log("🧠 Last context:", conversationContextRef.current);

    // Add user's message to UI
    const userMsg = { role: 'user', content: userMessage, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);

    try {
      const raw = await callOllamaServer(userMessage);
      const parsed = extractJSON(typeof raw === 'string' ? raw : JSON.stringify(raw));
      console.log('🔍 Parsed JSON from response:', parsed);

      // Fallback: show raw model text if parsing fails
      if (!parsed || !parsed.action) {
        const fallbackText = typeof raw === 'string' ? raw : JSON.stringify(raw);
        const assistantMsg = { role: 'assistant', content: fallbackText, timestamp: new Date() };
        setMessages(prev => [...prev, assistantMsg]);

        // Persist last exchange if service supports
        if (typeof UserMemoryService.setLastExchange === 'function') {
          UserMemoryService.setLastExchange(user.id, userMessage, fallbackText);
        }
        conversationContextRef.current.lastUserQuery = userMessage;
        conversationContextRef.current.lastBotResponse = fallbackText;
        UserMemoryService.updateConversationContext(user.id, { lastUserQuery: userMessage, lastBotResponse: fallbackText });

        return;
      }

      // Handle structured actions
      const action = parsed.action;
      const productIds = Array.isArray(parsed.product_ids) ? parsed.product_ids : [];
      const quantities = Array.isArray(parsed.quantities) ? parsed.quantities : [];
      const message = parsed.message || (action === 'add_to_cart' ? 'Added to cart.' : (action === 'recommend' ? 'Here are some recommendations.' : "I couldn't find anything."));

      if (action === 'add_to_cart') {
        console.log("🛒 ADD_TO_CART action received from Ollama");
        console.log("🆔 Product IDs to add:", productIds);
        console.log("🔢 Quantities:", quantities);

        const chosen = lookupProductsById(productIds);
        const added = [];
        const updated = [];

        for (let i = 0; i < chosen.length; i++) {
          const p = chosen[i];
          if (!p) continue;
          const q = (quantities[i] && Number.isInteger(quantities[i]) && quantities[i] > 0) ? quantities[i] : 1;
          console.log(`➕ Processing add: ${q}x "${p.title}" (ID: ${p.id})`);

          const already = (cart || []).some(ci => ci.id === p.id);
          if (already) {
            // If already in cart, we update quantity (use onAddToCart to increment existing quantity)
            console.log(`⚠️ Product already in cart -> updating quantity for ID ${p.id}`);
            try {
              onAddToCart(p, q); // app's addToCart merges/increments
            } catch (err) {
              console.warn('onAddToCart error while updating existing item:', err);
            }
            // update memory accordingly
            UserMemoryService.updateCartItem(user.id, { ...p, quantity: q, addedViaChatbot: true }, 'add');
            UserMemoryService.recordProductInteraction(user.id, p, 'cart_add');
            UserMemoryService.addMentionedProduct(user.id, p);
            updated.push(`${q}x "${p.title}"`);
          } else {
            // Not present -> add
            try {
              onAddToCart(p, q);
            } catch (err) {
              console.warn('onAddToCart error while adding item:', err);
            }
            UserMemoryService.updateCartItem(user.id, { ...p, quantity: q, addedViaChatbot: true }, 'add');
            UserMemoryService.recordProductInteraction(user.id, p, 'cart_add');
            UserMemoryService.addMentionedProduct(user.id, p);
            added.push(`${q}x "${p.title}"`);
          }
        }

        // Build user-facing text depending on adds vs updates
        let assistantText = '';
        if (added.length > 0) assistantText += `✅ Added to cart: ${added.join(', ')}.`;
        if (updated.length > 0) {
          if (assistantText) assistantText += ' ';
          assistantText += `⚠️ Product(s) already in cart — updated quantity: ${updated.join(', ')}.`;
        }
        if (!assistantText) assistantText = `I couldn't add items (they may already be in the cart). ${message}`;

        const assistantMsg = { role: 'assistant', content: assistantText, timestamp: new Date() };
        setMessages(prev => [...prev, assistantMsg]);

        console.log("💾 Saving memory:");
        console.log("   Last user query:", userMessage);
        console.log("   Last bot response:", assistantText);
        if (typeof UserMemoryService.setLastExchange === 'function') {
          UserMemoryService.setLastExchange(user.id, userMessage, assistantText);
        }
        conversationContextRef.current.lastUserQuery = userMessage;
        conversationContextRef.current.lastBotResponse = assistantText;
        UserMemoryService.updateConversationContext(user.id, { lastUserQuery: userMessage, lastBotResponse: assistantText });

        return;
      }

      if (action === 'recommend') {
        console.log("🤖 RECOMMEND action received from Ollama");
        console.log("🆔 Product IDs to recommend:", productIds);
        const recProducts = lookupProductsById(productIds).filter(Boolean);
        // Exclude any that are currently in cart
        const filtered = recProducts.filter(p => !(cart || []).some(ci => ci.id === p.id));

        let assistText = message;
        if (filtered.length > 0) {
          assistText += '\n\n' + filtered.map((p, i) => `${i + 1}. ${p.title} - ₹${p.priceINR} ⭐${p.rating?.rate || 'N/A'}`).join('\n');
        } else {
          assistText += '\n\nNo recommended items available (they may already be in your cart).';
        }

        const assistantMsg = { role: 'assistant', content: assistText, timestamp: new Date() };
        setMessages(prev => [...prev, assistantMsg]);

        if (typeof UserMemoryService.setLastExchange === 'function') {
          UserMemoryService.setLastExchange(user.id, userMessage, assistText);
        }
        conversationContextRef.current.lastUserQuery = userMessage;
        conversationContextRef.current.lastBotResponse = assistText;
        UserMemoryService.updateConversationContext(user.id, { lastUserQuery: userMessage, lastBotResponse: assistText });

        return;
      }

      // action === 'none' or unknown: show the message
      const assistantMsg = {
        role: 'assistant',
        content: parsed.message || "I couldn't determine an action. Please clarify.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMsg]);

      if (typeof UserMemoryService.setLastExchange === 'function') {
        UserMemoryService.setLastExchange(user.id, userMessage, assistantMsg.content);
      }
      conversationContextRef.current.lastUserQuery = userMessage;
      conversationContextRef.current.lastBotResponse = assistantMsg.content;
      UserMemoryService.updateConversationContext(user.id, { lastUserQuery: userMessage, lastBotResponse: assistantMsg.content });

    } catch (err) {
      console.error('Processing message error:', err);
      setError(err.message || 'Unknown error');
      const assistantMsg = { role: 'assistant', content: "I couldn't talk to the recommender right now — please try again later.", timestamp: new Date() };
      setMessages(prev => [...prev, assistantMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim() || isLoading) return;
    console.log("🟢 USER INPUT:", inputMessage);
    const msg = inputMessage.trim();
    setInputMessage('');
    processUserMessage(msg);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChatHistory = () => {
    setMessages([]);
    conversationContextRef.current = { lastUserQuery: null, lastBotResponse: null };
    UserMemoryService.updateConversationContext(user.id, { lastUserQuery: null, lastBotResponse: null });
    const greeting = UserMemoryService.getPersonalizedGreeting(user.id, user.name || 'there');
    setMessages([{ role: 'assistant', content: greeting, timestamp: new Date() }]);
    if (typeof UserMemoryService.setLastExchange === 'function') {
      UserMemoryService.setLastExchange(user.id, null, greeting);
    }
  };

  const exportChatHistory = () => {
    const chatText = messages.map(msg => `${msg.role === 'user' ? 'You' : 'ChatFit'}: ${msg.content}\n${msg.timestamp.toLocaleString()}`).join('\n\n');
    const blob = new Blob([chatText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chatfit-conversation-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!user || user.isAdmin) return null;

  return (
    <>
      {!isOpen && (
        <button className="chat-bot-toggle" onClick={() => setIsOpen(true)} aria-label="Open ChatFit Assistant">
          <MessageCircle size={20} /><span>ChatFit Assistant</span>
        </button>
      )}

      {isOpen && (
        <div className={`chat-bot ${isMinimized ? 'minimized' : ''}`}>
          <div className="chat-header" onClick={() => setIsMinimized(!isMinimized)}>
            <div className="chat-title">
              <img src={ChatFitAvatar} alt="ChatFit" style={{ width: 24, height: 24, borderRadius: '50%' }} />
              <span>ChatFit Assistant</span>
              <div className="chat-status"><div className="status-dot" /><span>Online</span></div>
            </div>
            <div className="chat-actions">
              <button className="action-btn" onClick={(e) => { e.stopPropagation(); exportChatHistory(); }} title="Export Chat" aria-label="Export chat"><Download size={16} /></button>
              <button className="action-btn" onClick={(e) => { e.stopPropagation(); clearChatHistory(); }} title="Clear Chat" aria-label="Clear chat"><Trash2 size={16} /></button>
              <button className="action-btn" onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }} title={isMinimized ? "Maximize" : "Minimize"} aria-label={isMinimized ? "Maximize chat" : "Minimize chat"}><Minimize2 size={16} /></button>
              <button className="action-btn" onClick={(e) => { e.stopPropagation(); setIsOpen(false); }} title="Close" aria-label="Close chat"><X size={16} /></button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {error && <div className="error-banner" role="alert"><span>{error}</span><button className="error-close" onClick={() => setError(null)} aria-label="Close error"><X size={16} /></button></div>}

              <div className="chat-messages" role="log" aria-live="polite">
                {messages.map((m, idx) => (
                  <div key={idx} className={`message ${m.role}`}>
                    <div className="message-avatar">{m.role === 'user' ? <User size={18} /> : <img src={ChatFitAvatar} alt="ChatFit" className="message-avatar-img" />}</div>
                    <div className="message-content">
                      <p>{m.content}</p>
                      <div className="message-timestamp">{m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="message assistant loading">
                    <div className="message-avatar"><img src={ChatFitAvatar} alt="ChatFit" className="message-avatar-img" /></div>
                    <div className="message-content">
                      <div className="typing-indicator"><span /><span /><span /></div>
                      <div className="typing-text">ChatFit is thinking...</div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {showSuggestedQuestions && messages.length <= 2 && (
                <div className="suggested-questions">
                  <div className="suggested-title">Try asking</div>
                  <div className="question-chips">
                    {suggestedQuestions.map((q, i) => (
                      <button
                        key={i}
                        className="question-chip"
                        onClick={() => {
                          console.log("🟡 Suggested question clicked:", q);
                          processUserMessage(q);
                        }}
                        disabled={isLoading}
                        aria-label={`Suggested question: ${q}`}
                      >
                        <MessageCircle size={14} />
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="chat-input-wrapper">
                <textarea ref={textareaRef} value={inputMessage} onChange={(e) => setInputMessage(e.target.value)} onKeyPress={handleKeyPress} placeholder="Type your message... (Press Enter to send)" disabled={isLoading} rows="1" aria-label="Chat input" />
                <button className="send-btn" onClick={handleSendMessage} disabled={!inputMessage.trim() || isLoading} title="Send message" aria-label="Send message"><Send size={18} /></button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default ChatBot;
