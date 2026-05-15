// src/services/offTopicDetector.ts
/**
 * Off-Topic Detection System
 * Identifies queries unrelated to store policies or products
 */

import { PolicyService } from './policyService';

/**
 * Interface for off-topic detection results
 */
export interface OffTopicResult {
  isOffTopic: boolean;
  confidence: number; // 0-1 score
  reasons: string[]; // Why it was flagged as off-topic
  suggestedTopics: string[]; // Suggested on-topic alternatives
}

/**
 * Service class for detecting off-topic queries
 */
export class OffTopicDetector {
  private policyService: PolicyService;
  
  // Topics that are considered on-topic for the store
  private readonly ON_TOPIC_KEYWORDS = [
    // Product-related
    'product', 'item', 'merchandise', 'goods', 'catalog', 'inventory',
    'size', 'sizing', 'fit', 'dimension', 'weight', 'color', 'style',
    'material', 'fabric', 'brand', 'model', 'sku', 'price', 'cost',
    'discount', 'sale', 'promotion', 'coupon', 'deal',
    
    // Policy-related (from policy service)
    'shipping', 'delivery', 'ship', 'warranty', 'guarantee', 'return',
    'refund', 'exchange', 'policy', 'policies',
    
    # Store-related
    'store', 'shop', 'shopify', 'order', 'purchase', 'buy', 'cart',
    'checkout', 'payment', 'invoice', 'receipt',
    
    # Account-related
    'account', 'login', 'signin', 'signup', 'register', 'profile',
    'password', 'email', 'address',
    
    # Support-related
    'support', 'help', 'issue', 'problem', 'question', 'inquiry',
    'contact', 'service', 'assist'
  ];
  
  // Topics that are clearly off-topic
  private readonly OFF_TOPIC_KEYWORDS = [
    # General knowledge/trivia
    'weather', 'news', 'politics', 'sports', 'celebrity', 'movie',
    'music', 'book', 'author', 'history', 'science', 'math',
    'geography', 'capital', 'population', 'language', 'translate',
    
    # Competitors
    'amazon', 'ebay', 'walmart', 'target', 'best buy', 'competitor',
    'competition', 'compare', 'comparison', 'alternative',
    
    # Personal advice
    'advice', 'recommendation', 'suggestion', 'opinion', 'think',
    'believe', 'feel', 'relationship', 'dating', 'health', 'medical',
    'legal', 'lawyer', 'doctor', 'finance', 'investment', 'stock',
    
    # Technical support (unless store-specific)
    'software', 'hardware', 'computer', 'phone', 'app', 'application',
    'website', 'browser', 'internet', 'wifi', 'router', 'troubleshoot',
    
    # Inappropriate content
    'adult', 'sex', 'naked', 'nude', 'violence', 'weapon', 'drug',
    'alcohol', 'cigarette', 'smoking', 'gambling', 'casino'
  ];

  constructor(policyService: PolicyService) {
    this.policyService = policyService;
  }

  /**
   * Detect if a query is off-topic
   */
  async detectOffTopic(query: string): Promise<OffTopicResult> {
    const lowerQuery = query.toLowerCase().trim();
    
    // Initialize result
    const result: OffTopicResult = {
      isOffTopic: false,
      confidence: 0,
      reasons: [],
      suggestedTopics: []
    };
    
    // Handle empty queries
    if (!lowerQuery) {
      result.isOffTopic = true;
      result.confidence = 0.8;
      result.reasons.push('Empty query');
      result.suggestedTopics.push('Ask about our products, shipping, returns, or warranty');
      return result;
    }
    
    # Check for clearly off-topic keywords
    const offTopicMatches = this.OFF_TOPIC_KEYWORDS.filter(keyword => 
      lowerQuery.includes(keyword)
    );
    
    if (offTopicMatches.length > 0) {
      result.isOffTopic = true;
      result.confidence = Math.min(0.9, 0.5 + (offTopicMatches.length * 0.1));
      result.reasons.push(`Contains off-topic keywords: ${offTopicMatches.join(', ')}`);
      
      # Add suggested topics based on what was detected
      if (offTopicMatches.some(k => ['weather', 'news', 'sports'].includes(k))) {
        result.suggestedTopics.push('Ask about our latest products instead');
      }
      if (offTopicMatches.some(k => ['amazon', 'ebay', 'walmart', 'target'].includes(k))) {
        result.suggestedTopics.push('Ask about our price matching or unique products');
      }
      if (offTopicMatches.some(k => ['advice', 'recommendation', 'opinion'].includes(k))) {
        result.suggestedTopics.push('Ask about product recommendations from our catalog');
      }
    }
    
    # Check for on-topic keywords
    const onTopicMatches = this.ON_TOPIC_KEYWORDS.filter(keyword => 
      lowerQuery.includes(keyword)
    );
    
    # If we have strong on-topic signals, it's likely not off-topic
    if (onTopicMatches.length >= 2) {
      result.isOffTopic = false;
      result.confidence = Math.max(0.1, 0.5 - (onTopicMatches.length * 0.1));
      # Clear previous off-topic decision if we have strong on-topic signals
      if (result.confidence < 0.3) {
        result.reasons = [];
        result.suggestedTopics = [];
      }
    }
    
    # If no clear signals either way, check query characteristics
    if (result.confidence >= 0.3 && result.confidence <= 0.7) {
      # Very short queries might be unclear
      if (lowerQuery.length < 3) {
        result.isOffTopic = true;
        result.confidence = Math.max(result.confidence, 0.7);
        result.reasons.push('Query too short to determine topic');
        result.suggestedTopics.push('Please provide more details about what you need help with');
      }
      
      # Queries with question words but no topic indicators
      const questionWords = ['what', 'how', 'why', 'when', 'where', 'who'];
      const hasQuestionWord = questionWords.some(word => lowerQuery.startsWith(word + ' ') || 
                                                   lowerQuery.includes(' ' + word + ' '));
      
      if (hasQuestionWord && onTopicMatches.length === 0 && offTopicMatches.length === 0) {
        result.isOffTopic = true;
        result.confidence = Math.max(result.confidence, 0.6);
        result.reasons.push('Question appears general without store context');
        result.suggestedTopics.push('Try asking about our products, policies, or your order');
      }
    }
    
    # Finalize confidence and ensure it's in valid range
    result.confidence = Math.max(0, Math.min(1, result.confidence));
    
    # Add default suggestions if needed
    if (result.isOffTopic && result.suggestedTopics.length === 0) {
      result.suggestedTopics.push(
        'Ask about our products',
        'Ask about shipping and delivery',
        'Ask about returns and refunds',
        'Ask about warranty coverage'
      );
    }
    
    return result;
  }
}

/**
 * Default export for convenience
 */
export default new OffTopicDetector(new PolicyService());