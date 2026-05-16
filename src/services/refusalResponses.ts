// src/services/refusalResponses.ts
/**
 * Polite Refusal Responses System
 * Generates helpful, polite refusals for off-topic queries
 */

import { OffTopicDetector, OffTopicResult } from './offTopicDetector';
import { PolicyService } from './policyService';

/**
 * Interface for refusal response options
 */
export interface RefusalResponse {
  message: string;
  suggestions: string[]; // Helpful alternatives to redirect conversation
  tone: 'polite' | 'helpful' | 'neutral'; // Tone of the response
}

/**
 * Service class for generating polite refusal responses
 */
export class RefusalResponseService {
  private offTopicDetector: OffTopicDetector;

  constructor(offTopicDetector: OffTopicDetector) {
    this.offTopicDetector = offTopicDetector;
  }

  /**
   * Generate a polite refusal response for an off-topic query
   */
  async generateRefusal(query: string): Promise<RefusalResponse | null> {
    // Get off-topic analysis
    const offTopicResult = await this.offTopicDetector.detectOffTopic(query);
    
    // If not actually off-topic, return null
    if (!offTopicResult.isOffTopic) {
      return null;
    }
    
    // Generate response based on the detected off-topic category
    const refusal = this._generateContextualRefusal(query, offTopicResult);
    
    return refusal;
  }

  /**
   * Generate a contextual refusal based on the off-topic detection results
   */
  private _generateContextualRefusal(
    query: string,
    offTopicResult: OffTopicResult
  ): RefusalResponse {
    const lowerQuery = query.toLowerCase();
    
    // Default polite refusal
    let message = "I'm here to help with questions about our store, products, policies, and your orders. ";
    let suggestions = [
      "Ask about our products or collections",
      "Inquire about shipping and delivery options",
      "Check our return and refund policy",
      "Learn about our warranty coverage"
    ];
    
    // Customize based on detected off-topic categories
    if (offTopicResult.reasons.some(reason => 
        reason.toLowerCase().includes('weather') || 
        reason.toLowerCase().includes('news') || 
        reason.toLowerCase().includes('sports'))) {
      message = "I specialize in store-related assistance rather than general news or weather updates. ";
      suggestions = [
        "Ask about our latest product arrivals",
        "Check current promotions and discounts",
        "Inquire about product availability",
        "Get help with an existing order"
      ];
    }
    
    if (offTopicResult.reasons.some(reason => 
        ['amazon', 'ebay', 'walmart', 'target', 'competitor'].some(
          keyword => reason.toLowerCase().includes(keyword)
        )
      )) {
      message = "I can only provide information about our store and products, not competitors. ";
      suggestions = [
        "Ask about our unique product features",
        "Inquire about our price matching policy",
        "Learn about our exclusive brands",
        "Check our customer reviews and ratings"
      ];
    }
    
    if (offTopicResult.reasons.some(reason => 
        ['advice', 'recommendation', 'opinion', 'suggestion'].some(
          keyword => reason.toLowerCase().includes(keyword)
        )
      )) {
      message = "While I can't give personal advice, I can help you find information about our products and policies. ";
      suggestions = [
        "Get product recommendations based on features",
        "Ask about bestsellers in specific categories",
        "Inquire about product specifications and details",
        "Get help comparing our similar products"
      ];
    }
    
    if (offTopicResult.reasons.some(reason => 
        ['software', 'hardware', 'computer', 'phone', 'app', 'technical'].some(
          keyword => reason.toLowerCase().includes(keyword)
        )
      ) && !offTopicResult.reasons.some(reason => 
        ['order', 'product', 'store'].some(
          keyword => reason.toLowerCase().includes(keyword)
        )
      )) {
      message = "I'm focused on helping with store inquiries rather than technical support for devices or software. ";
      suggestions = [
        "Ask about tech products we sell in our store",
        "Inquire about warranty coverage for electronics",
        "Get help with purchasing devices from our store",
        "Learn about our return policy for tech items"
      ];
    }
    
    if (offTopicResult.reasons.some(reason => 
        reason.toLowerCase().includes('too short') || 
        reason.toLowerCase().includes('general')
      )) {
      message = "I'd be happy to help! Could you please provide more details about what you're looking for? ";
      suggestions = [
        "Tell me what product you're interested in",
        "Ask about a specific policy (shipping, returns, warranty)",
        "Get help with an order you've placed",
        "Inquire about product availability or sizing"
      ];
    }
    
    // Ensure we have suggestions
    if (suggestions.length === 0) {
      suggestions = [
        "Ask about our products or collections",
        "Inquire about shipping and delivery options",
        "Check our return and refund policy",
        "Learn about our warranty coverage"
      ];
    }
    
    // Limit suggestions to top 4
    suggestions = suggestions.slice(0, 4);
    
    return {
      message: message.trim(),
      suggestions: suggestions,
      tone: 'polite'
    };
  }

  /**
   * Generate a simple polite refusal (fallback)
   */
  generateSimpleRefusal(): RefusalResponse {
    return {
      message: "I'm here to assist with store-related questions about our products, policies, and orders. Is there something I can help you with regarding our store?",
      suggestions: [
        "Ask about our products",
        "Check shipping information",
        "Learn about return policy",
        "Inquire about warranty coverage"
      ],
      tone: 'polite'
    };
  }
}

/**
 * Default export for convenience
 */
export default new RefusalResponseService(new OffTopicDetector(new PolicyService()));