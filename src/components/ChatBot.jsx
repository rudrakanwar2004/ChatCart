import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Send, X, Minimize2, MessageCircle, User, Trash2, Download } from 'lucide-react';
import ChatFitAvatar from '../assets/ChatFit.png';
import UserMemoryService from '../UserMemories/userMemoryService';

const OLLAMA_CONFIG = {
  url: 'http://localhost:11434',
  model: 'llama3.2:1b',
  timeout: 45000
};

const ChatBot = ({ products, user, onAddToCart, cart }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showSuggestedQuestions, setShowSuggestedQuestions] = useState(true);
  const [lastDisplayedProducts, setLastDisplayedProducts] = useState([]);
  
  // Dynamic conversation context with comprehensive tracking
  const [conversationContext, setConversationContext] = useState({
    // User query tracking
    lastUserQuery: null,
    lastUserIntent: null,
    lastQueryTime: null,
    
    // Response tracking
    lastBotResponse: null,
    lastResponseType: null,
    
    // Product tracking
    currentCategory: null,
    activeFilters: {
      maxPrice: null,
      minRating: null,
      category: null,
      searchQuery: null
    },
    
    // Conversation flow
    conversationFlow: [],
    currentTopic: null,
    
    // User preferences from memory
    userPreferences: null,
    
    // Session tracking
    sessionStartTime: new Date().toISOString(),
    messageCount: 0
  });

  // Refs for dynamic updates
  const conversationContextRef = useRef(conversationContext);
  const lastUserQueryRef = useRef(null);
  const lastBotResponseRef = useRef(null);
  const conversationHistoryRef = useRef([]);
  
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  // Sync refs with state changes
  useEffect(() => {
    conversationContextRef.current = conversationContext;
  }, [conversationContext]);

  // Initialize with user memory
  useEffect(() => {
    if (user && !user.isAdmin) {
      initializeUserSession();
    }
  }, [user]);

  const initializeUserSession = useCallback(() => {
    const userMemory = UserMemoryService.getUserMemory(user.id);
    
    // Set user name if not set
    if (!userMemory.userName && user.name) {
      UserMemoryService.setUserName(user.id, user.name);
    }
    
    // Load conversation context from memory
    if (userMemory.conversationContext) {
      const initialContext = {
        ...conversationContext,
        ...userMemory.conversationContext,
        userPreferences: userMemory.preferences || null,
        sessionStartTime: new Date().toISOString(),
        messageCount: 0
      };
      
      setConversationContext(initialContext);
      conversationContextRef.current = initialContext;
      
      // Load conversation history
      if (userMemory.chatHistory?.length > 0) {
        conversationHistoryRef.current = userMemory.chatHistory.slice(-10);
      }
    }
    
    // Set initial greeting
    if (messages.length === 0) {
      const userName = user.name || 'there';
      const greeting = UserMemoryService.getPersonalizedGreeting(user.id, userName);
      setMessages([{ role: 'assistant', content: greeting, timestamp: new Date() }]);
      UserMemoryService.updateUserMemory(user.id, { isNewUser: false });
    }
  }, [user]);

  // Auto-scroll and resize
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [inputMessage]);

  // Sync cart with user memory
  useEffect(() => {
    if (user && !user.isAdmin && cart) {
      const userMemory = UserMemoryService.getUserMemory(user.id);
      if (JSON.stringify(userMemory.cartItems || []) !== JSON.stringify(cart)) {
        UserMemoryService.updateUserMemory(user.id, { cartItems: cart });
      }
    }
  }, [cart, user]);

  // Dynamic context updater
  const updateContext = useCallback((updates, type = 'user_query') => {
    const currentContext = conversationContextRef.current;
    const newConversationFlow = [
      ...currentContext.conversationFlow.slice(-5),
      {
        type,
        timestamp: new Date().toISOString(),
        ...updates
      }
    ];

    const newContext = {
      ...currentContext,
      ...updates,
      conversationFlow: newConversationFlow,
      messageCount: currentContext.messageCount + 1,
      lastUpdated: new Date().toISOString()
    };

    conversationContextRef.current = newContext;
    setConversationContext(newContext);

    // Persist to user memory
    if (user && !user.isAdmin) {
      UserMemoryService.updateConversationContext(user.id, {
        ...newContext,
        userPreferences: undefined // Don't persist preferences in conversation context
      });
    }

    return newContext;
  }, [user]);

  // Detect user intent from message
  const detectIntent = useCallback((message) => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('add') && (lowerMessage.includes('cart') || lowerMessage.includes('number') || 
        /\b(1st|2nd|3rd|4th|5th|first|second|third|fourth|fifth)\b/.test(lowerMessage))) {
      return 'add_to_cart';
    }
    
    if (lowerMessage.includes('cart') && (lowerMessage.includes('what') || lowerMessage.includes('show'))) {
      return 'view_cart';
    }
    
    if (lowerMessage.includes('electronic') || lowerMessage.includes('gadget') || lowerMessage.includes('tech')) {
      return 'electronics_query';
    }
    
    if (lowerMessage.includes('fashion') || lowerMessage.includes('clothing') || lowerMessage.includes('dress') || lowerMessage.includes('shirt')) {
      return 'fashion_query';
    }
    
    if (lowerMessage.includes('headphone') || lowerMessage.includes('earphone') || lowerMessage.includes('audio')) {
      return 'specific_product_query';
    }
    
    if (lowerMessage.includes('under') || lowerMessage.includes('below') || lowerMessage.includes('less than')) {
      return 'price_filter_query';
    }
    
    if (lowerMessage.includes('gift') || lowerMessage.includes('birthday') || lowerMessage.includes('present')) {
      return 'gift_query';
    }
    
    if (lowerMessage.includes('recommend') || lowerMessage.includes('suggest')) {
      return 'recommendation_query';
    }
    
    return 'general_query';
  }, []);

  // Get products based on context
  const getContextualProducts = useCallback((intent, message = '') => {
    const context = conversationContextRef.current;
    const lowerMessage = message.toLowerCase();
    
    let filteredProducts = [...products];
    
    // Apply active filters from context
    if (context.activeFilters.maxPrice) {
      filteredProducts = filteredProducts.filter(p => p.priceINR <= context.activeFilters.maxPrice);
    }
    
    if (context.activeFilters.category) {
      filteredProducts = filteredProducts.filter(p => p.category === context.activeFilters.category);
    }
    
    // Apply intent-specific filtering
    switch(intent) {
      case 'electronics_query':
        filteredProducts = filteredProducts.filter(p => 
          p.category === 'electronics' ||
          p.title.toLowerCase().includes('phone') ||
          p.title.toLowerCase().includes('laptop') ||
          p.title.toLowerCase().includes('tablet') ||
          p.title.toLowerCase().includes('watch')
        );
        break;
        
      case 'fashion_query':
        filteredProducts = filteredProducts.filter(p => 
          p.category === 'fashion' ||
          p.title.toLowerCase().includes('shirt') ||
          p.title.toLowerCase().includes('dress') ||
          p.title.toLowerCase().includes('jacket') ||
          p.title.toLowerCase().includes('clothing')
        );
        break;
        
      case 'specific_product_query':
        if (lowerMessage.includes('headphone')) {
          filteredProducts = filteredProducts.filter(p => 
            p.title.toLowerCase().includes('headphone') ||
            p.title.toLowerCase().includes('earphone') ||
            p.category === 'electronics'
          );
        }
        break;
        
      case 'gift_query':
        filteredProducts = filteredProducts.filter(p => 
          (p.rating?.rate || 0) >= 4.0 &&
          (p.discount || 0) >= 10
        );
        break;
        
      case 'price_filter_query':
        const priceMatch = lowerMessage.match(/(?:under|below|less than)\s*₹?\s*(\d+)/i);
        if (priceMatch) {
          const maxPrice = parseInt(priceMatch[1]);
          updateContext({
            activeFilters: { ...context.activeFilters, maxPrice }
          });
          filteredProducts = filteredProducts.filter(p => p.priceINR <= maxPrice);
        }
        break;
    }
    
    // Sort by rating and limit
    filteredProducts.sort((a, b) => (b.rating?.rate || 0) - (a.rating?.rate || 0));
    return filteredProducts.slice(0, 5);
  }, [products, updateContext]);

  // Extract product from message with context awareness
  const extractProductFromMessage = useCallback((message) => {
    const lowerMessage = message.toLowerCase();
    const currentProducts = lastDisplayedProducts.length > 0 ? lastDisplayedProducts : [];
    
    if (currentProducts.length === 0) return null;

    // Position mapping with context awareness
    const positionMap = {
      'first': 0, '1st': 0, 'number 1': 0, '1': 0, 'one': 0,
      'second': 1, '2nd': 1, 'number 2': 1, '2': 1, 'two': 1,
      'third': 2, '3rd': 2, 'number 3': 2, '3': 2, 'three': 2,
      'fourth': 3, '4th': 3, 'number 4': 3, '4': 3, 'four': 3,
      'fifth': 4, '5th': 4, 'number 5': 4, '5': 4, 'five': 4
    };

    // Check for positional references
    for (const [key, index] of Object.entries(positionMap)) {
      if (lowerMessage.includes(key) && currentProducts.length > index) {
        return currentProducts[index];
      }
    }

    // Check for product name mentions with fuzzy matching
    for (const product of currentProducts) {
      const productTitle = product.title?.toLowerCase();
      if (!productTitle) continue;
      
      // Exact match
      if (lowerMessage.includes(productTitle)) {
        return product;
      }
      
      // Partial word matching
      const productWords = productTitle.split(' ');
      const hasMatch = productWords.some(word => 
        word.length > 3 && lowerMessage.includes(word)
      );
      
      if (hasMatch) {
        return product;
      }
      
      // Category matching from context
      const context = conversationContextRef.current;
      if (context.currentCategory && product.category === context.currentCategory) {
        const categoryKeywords = {
          'electronics': ['phone', 'laptop', 'tablet', 'watch', 'headphone'],
          'fashion': ['shirt', 'dress', 'jacket', 'clothing', 'suit']
        };
        
        if (categoryKeywords[context.currentCategory]?.some(keyword => 
          lowerMessage.includes(keyword) && productTitle.includes(keyword)
        )) {
          return product;
        }
      }
    }

    return null;
  }, [lastDisplayedProducts]);

  const extractQuantity = useCallback((message) => {
    const lowerMessage = message.toLowerCase();
    
    // Clean message from position indicators
    const cleanMessage = lowerMessage
      .replace(/(\d+)(?:st|nd|rd|th)/gi, '')
      .replace(/(?:first|second|third|fourth|fifth|one|two|three|four|five)/gi, '');

    // Look for quantity patterns
    const quantityPatterns = [
      /(\d+)\s*x\s*(?:of)?/,
      /(\d+)\s*quantity/,
      /(\d+)\s*items?/,
      /(\d+)\s*pieces?/,
      /add\s*(\d+)\s*(?:more)?/,
      /(\d+)\s*units?/
    ];

    for (const pattern of quantityPatterns) {
      const match = cleanMessage.match(pattern);
      if (match) return parseInt(match[1]);
    }

    return 1;
  }, []);

  const handleAddToCart = useCallback((product, quantity = 1) => {
    try {
      onAddToCart(product, quantity);
      UserMemoryService.updateCartItem(user.id, { ...product, quantity }, 'add');
      UserMemoryService.recordProductInteraction(user.id, product, "cart_add");
      UserMemoryService.addMentionedProduct(user.id, product);
      return true;
    } catch (error) {
      console.error('Error adding to cart:', error);
      return false;
    }
  }, [user, onAddToCart]);

  const formatProductResponse = useCallback((productList, context = null) => {
    if (!productList || productList.length === 0) {
      return "I couldn't find any products matching your request. Please try a different search term.";
    }

    setLastDisplayedProducts(productList);

    let response = "";
    if (context) {
      response += `${context}\n\n`;
    }
    
    response += "Here are the products I found:\n\n";

    productList.forEach((product, index) => {
      const discountText = product.discount ? ` (${product.discount}% off)` : '';
      const ratingText = product.rating ? ` ⭐${product.rating.rate}` : '';
      response += `${index + 1}. ${product.title} - ₹${product.priceINR}${discountText}${ratingText}\n`;
    });

    response += `\nYou can say "add the 1st one" or "add number 3" to add any product to your cart!`;

    return response;
  }, []);

  const getCartSummary = useCallback(() => {
    if (!cart || cart.length === 0) {
      return "Your cart is currently empty. Would you like to browse some products?";
    }

    let summary = "Here's what's in your cart:\n\n";
    cart.forEach((item, index) => {
      summary += `${index + 1}. ${item.title} - ₹${item.priceINR} x ${item.quantity} = ₹${item.priceINR * item.quantity}\n`;
    });

    const total = cart.reduce((sum, item) => sum + (item.priceINR * item.quantity), 0);
    summary += `\nTotal: ₹${total}\n\nWould you like to proceed to checkout or continue shopping?`;

    return summary;
  }, [cart]);

  // Dynamic response generator with context awareness
  const generateContextAwareResponse = useCallback(async (userMessage) => {
    const intent = detectIntent(userMessage);
    const context = conversationContextRef.current;
    
    // Update context with current query
    updateContext({
      lastUserQuery: userMessage,
      lastUserIntent: intent,
      lastQueryTime: new Date().toISOString(),
      currentTopic: intent
    });

    // Handle specific intents directly
    switch(intent) {
      case 'view_cart':
        return getCartSummary();
        
      case 'add_to_cart':
        const product = extractProductFromMessage(userMessage);
        const quantity = extractQuantity(userMessage);
        
        if (product) {
          const success = handleAddToCart(product, quantity);
          if (success) {
            const response = `✅ Added ${quantity}x "${product.title}" to your cart for ₹${product.priceINR * quantity}!`;
            
            // Get similar products
            const similarProducts = products
              .filter(p => p.category === product.category && p.id !== product.id)
              .sort((a, b) => (b.rating?.rate || 0) - (a.rating?.rate || 0))
              .slice(0, 3);
            
            if (similarProducts.length > 0) {
              return response + `\n\n🛍️ You might also like:\n${similarProducts.map(p => 
                `• ${p.title} - ₹${p.priceINR} ⭐${p.rating?.rate || 'N/A'}`
              ).join('\n')}`;
            }
            return response;
          }
          return "Sorry, I couldn't add that item to your cart. Please try again.";
        }
        return "I couldn't find the specific product you mentioned. Please refer to a product from the list above using numbers like 'add the 2nd one' or 'add number 3'.";
    }

    // For other queries, get contextual products
    const contextualProducts = getContextualProducts(intent, userMessage);
    
    if (contextualProducts.length > 0) {
      let contextMessage = "Here are the products I found:";
      
      if (intent === 'electronics_query') {
        contextMessage = "Here are our electronics products:";
        updateContext({ currentCategory: 'electronics' });
      } else if (intent === 'fashion_query') {
        contextMessage = "Here are our fashion products:";
        updateContext({ currentCategory: 'fashion' });
      } else if (intent === 'gift_query') {
        contextMessage = "Here are some great gift ideas:";
      } else if (context.activeFilters.maxPrice) {
        contextMessage = `Here are products under ₹${context.activeFilters.maxPrice}:`;
      }
      
      return formatProductResponse(contextualProducts, contextMessage);
    }

    // Fallback to Ollama for complex queries
    return await generateOllamaResponse(userMessage, intent);
  }, [detectIntent, updateContext, getCartSummary, extractProductFromMessage, extractQuantity, handleAddToCart, products, getContextualProducts, formatProductResponse]);

  // Enhanced Ollama response with comprehensive context
  const generateOllamaResponse = useCallback(async (userMessage, intent) => {
    try {
      const context = conversationContextRef.current;
      const userMemory = UserMemoryService.getUserMemory(user.id);
      
      // Build comprehensive context string
      const contextParts = [];
      
      if (context.lastUserQuery && context.lastBotResponse) {
        contextParts.push(`Previous exchange:\n- You asked: "${context.lastUserQuery}"\n- I responded: "${context.lastBotResponse.substring(0, 100)}..."`);
      }
      
      if (context.currentCategory) {
        contextParts.push(`We're currently discussing ${context.currentCategory} products.`);
      }
      
      if (context.activeFilters.maxPrice) {
        contextParts.push(`You're looking for products under ₹${context.activeFilters.maxPrice}.`);
      }
      
      if (context.currentTopic) {
        contextParts.push(`Current topic: ${context.currentTopic.replace('_', ' ')}`);
      }
      
      // Get relevant products based on current context
      const relevantProducts = getContextualProducts(intent, userMessage);
      
      const availableProducts = relevantProducts.slice(0, 10).map((p, i) =>
        `${i + 1}. ${p.title}: ₹${p.priceINR} (${p.category}, ${p.rating?.rate || 'N/A'}⭐)`
      ).join('\n');

      const conversationHistory = conversationHistoryRef.current.slice(-2).map(msg => 
        `User: ${msg.userMessage}\nAssistant: ${msg.botResponse}`
      ).join('\n\n');

      const prompt = `
You are ChatFit, an intelligent shopping assistant for ChatCart. You MUST consider the entire conversation context.

IMPORTANT CONTEXT:
${contextParts.join('\n')}

CONVERSATION HISTORY:
${conversationHistory || 'No previous conversation in this session.'}

CURRENT SITUATION:
- User's message: "${userMessage}"
- User's intent: ${intent}
- Active filters: ${context.activeFilters.maxPrice ? `Price under ₹${context.activeFilters.maxPrice}` : 'None'}
- Current category focus: ${context.currentCategory || 'None'}

AVAILABLE PRODUCTS (use ONLY these - do NOT invent products):
${availableProducts}

CRITICAL INSTRUCTIONS:
1. Remember the context above - this is crucial for a natural conversation
2. If user asks about products, only suggest from AVAILABLE PRODUCTS
3. If context has price filter, respect it in your recommendations
4. If we were discussing a specific category, continue in that context
5. Be helpful, concise, and maintain conversation flow
6. If user refers to previous products, use the context to understand which ones

ASSISTANT (responding with full context awareness):`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), OLLAMA_CONFIG.timeout);

      const response = await fetch(`${OLLAMA_CONFIG.url}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: OLLAMA_CONFIG.model,
          prompt: prompt,
          stream: false,
          options: { 
            temperature: 0.3,  // Lower temperature for more consistent, context-aware responses
            top_k: 40,
            top_p: 0.8,
            repeat_penalty: 1.2,  // Penalize repetition to avoid hallucinations
            num_predict: 300  // Limit response length
          }
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.status}`);
      }

      const data = await response.json();
      return data.response || data.output || data.text || JSON.stringify(data);
      
    } catch (error) {
      console.error('Error generating Ollama response:', error);
      
      // Intelligent fallback based on context
      const context = conversationContextRef.current;
      if (context.lastUserIntent === 'price_filter_query' && context.activeFilters.maxPrice) {
        return `I apologize for the technical issue. Based on our conversation, you were looking for products under ₹${context.activeFilters.maxPrice}. Would you like me to show you those again?`;
      } else if (context.currentCategory) {
        return `I'm having trouble connecting. You were looking at ${context.currentCategory} products. Would you like to see those again?`;
      }
      
      return "I apologize, but I'm having trouble processing your request right now. Please try asking about specific products or your cart.";
    }
  }, [user, getContextualProducts]);

  const processUserMessage = async (userMessage) => {
    setIsLoading(true);
    setError(null);
    setShowSuggestedQuestions(false);

    try {
      // Add user message to UI
      const userMsg = { role: 'user', content: userMessage, timestamp: new Date() };
      setMessages(prev => [...prev, userMsg]);

      // Generate context-aware response
      const aiResponse = await generateContextAwareResponse(userMessage);

      // Add assistant response
      const assistantMsg = { role: 'assistant', content: aiResponse, timestamp: new Date() };
      setMessages(prev => [...prev, assistantMsg]);

      // Update context with this interaction
      updateContext({
        lastBotResponse: aiResponse,
        lastResponseType: 'assistant_response'
      }, 'assistant_response');

      // Update conversation history
      conversationHistoryRef.current = [
        ...conversationHistoryRef.current.slice(-9),
        { userMessage, botResponse: aiResponse, timestamp: new Date().toISOString() }
      ];

      // Save to user memory
      UserMemoryService.addChatHistory(user.id, userMessage, aiResponse);

    } catch (error) {
      console.error('Error processing message:', error);
      setError(error.message);
      
      const errorMsg = { 
        role: 'assistant', 
        content: "I apologize, but I'm having trouble processing your request. Please try again in a moment.",
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim() || isLoading) return;
    const message = inputMessage.trim();
    setInputMessage('');
    processUserMessage(message);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSuggestedQuestion = (question) => {
    processUserMessage(question);
  };

  const clearChatHistory = () => {
    setMessages([]);
    setLastDisplayedProducts([]);
    setConversationContext({
      lastUserQuery: null,
      lastUserIntent: null,
      lastQueryTime: null,
      lastBotResponse: null,
      lastResponseType: null,
      currentCategory: null,
      activeFilters: {
        maxPrice: null,
        minRating: null,
        category: null,
        searchQuery: null
      },
      conversationFlow: [],
      currentTopic: null,
      userPreferences: null,
      sessionStartTime: new Date().toISOString(),
      messageCount: 0
    });
    
    conversationContextRef.current = {
      lastUserQuery: null,
      lastUserIntent: null,
      lastQueryTime: null,
      lastBotResponse: null,
      lastResponseType: null,
      currentCategory: null,
      activeFilters: {
        maxPrice: null,
        minRating: null,
        category: null,
        searchQuery: null
      },
      conversationFlow: [],
      currentTopic: null,
      userPreferences: null,
      sessionStartTime: new Date().toISOString(),
      messageCount: 0
    };
    
    conversationHistoryRef.current = [];
    setShowSuggestedQuestions(true);
    
    if (user && !user.isAdmin) {
      const userName = user.name || 'there';
      const greeting = UserMemoryService.getPersonalizedGreeting(user.id, userName);
      setMessages([{ role: 'assistant', content: greeting, timestamp: new Date() }]);
      
      UserMemoryService.updateConversationContext(user.id, {
        lastUserQuery: null,
        lastUserIntent: null,
        currentCategory: null,
        activeFilters: {
          maxPrice: null,
          minRating: null,
          category: null,
          searchQuery: null
        },
        conversationFlow: []
      });
    }
  };

  const exportChatHistory = () => {
    const chatText = messages.map(msg => 
      `${msg.role === 'user' ? 'You' : 'ChatFit'}: ${msg.content}\n${msg.timestamp.toLocaleString()}`
    ).join('\n\n');
    
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

  const suggestedQuestions = useMemo(() => [
    "What electronics do you have?",
    "Show me fashion products",
    "What's in my cart?",
    "Show me products under ₹2000",
    "Help me find wireless headphones"
  ], []);

  if (!user || user.isAdmin) return null;

  return (
    <>
      {!isOpen && (
        <button 
          className="chat-bot-toggle"
          onClick={() => setIsOpen(true)}
          aria-label="Open ChatFit Assistant"
        >
          <MessageCircle size={20} />
          <span>ChatFit Assistant</span>
        </button>
      )}

      {isOpen && (
        <div className={`chat-bot ${isMinimized ? 'minimized' : ''}`}>
          <div className="chat-header" onClick={() => setIsMinimized(!isMinimized)}>
            <div className="chat-title">
              <img 
                src={ChatFitAvatar} 
                alt="ChatFit" 
                style={{ width: '24px', height: '24px', borderRadius: '50%' }}
              />
              <span>ChatFit Assistant</span>
              <div className="chat-status">
                <div className="status-dot" />
                <span>Online</span>
              </div>
            </div>
            <div className="chat-actions">
              <button 
                className="action-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  exportChatHistory();
                }}
                title="Export Chat"
                aria-label="Export chat"
              >
                <Download size={16} />
              </button>
              <button 
                className="action-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  clearChatHistory();
                }}
                title="Clear Chat"
                aria-label="Clear chat"
              >
                <Trash2 size={16} />
              </button>
              <button 
                className="action-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMinimized(!isMinimized);
                }}
                title={isMinimized ? "Maximize" : "Minimize"}
                aria-label={isMinimized ? "Maximize chat" : "Minimize chat"}
              >
                <Minimize2 size={16} />
              </button>
              <button 
                className="action-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                }}
                title="Close"
                aria-label="Close chat"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {error && (
                <div className="error-banner" role="alert">
                  <span>{error}</span>
                  <button 
                    className="error-close"
                    onClick={() => setError(null)}
                    aria-label="Close error"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}

              <div className="chat-messages" role="log" aria-live="polite">
                {messages.map((message, index) => (
                  <div key={index} className={`message ${message.role}`}>
                    <div className="message-avatar">
                      {message.role === 'user' ? (
                        <User size={18} />
                      ) : (
                        <img 
                          src={ChatFitAvatar} 
                          alt="ChatFit"
                          className="message-avatar-img"
                        />
                      )}
                    </div>
                    <div className="message-content">
                      <p>{message.content}</p>
                      <div className="message-timestamp">
                        {message.timestamp.toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="message assistant loading">
                    <div className="message-avatar">
                      <img 
                        src={ChatFitAvatar} 
                        alt="ChatFit"
                        className="message-avatar-img"
                      />
                    </div>
                    <div className="message-content">
                      <div className="typing-indicator">
                        <span />
                        <span />
                        <span />
                      </div>
                      <div className="typing-text">ChatFit is thinking...</div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {showSuggestedQuestions && messages.length <= 2 && (
                <div className="suggested-questions">
                  <div className="suggested-title">Quick questions to get started</div>
                  <div className="question-chips">
                    {suggestedQuestions.map((question, index) => (
                      <button
                        key={index}
                        className="question-chip"
                        onClick={() => handleSuggestedQuestion(question)}
                        disabled={isLoading}
                        aria-label={`Suggested question: ${question}`}
                      >
                        <MessageCircle size={14} />
                        {question}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="chat-input-wrapper">
                <textarea
                  ref={textareaRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message... (Press Enter to send)"
                  disabled={isLoading}
                  rows="1"
                  aria-label="Chat input"
                />
                <button
                  className="send-btn"
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  title="Send message"
                  aria-label="Send message"
                >
                  <Send size={18} />
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default ChatBot;