export interface ContextPayload {
  rootCause: string;
  impact: string;
  suggestedAction: string;
}

/**
 * Context Engine parses raw operational states (KPIs, Alerts, Recommendations)
 * and attaches Root Cause, Impact, and Suggested Action insights.
 */
export class ContextEngine {
  
  /**
   * Generates context insights for dynamic KPIs.
   */
  static getKPIContext(kpiName: string, currentValue: number, target: number): ContextPayload {
    const isTargetMet = currentValue >= target;
    const deficitRate = target > 0 ? Math.round(((target - currentValue) / target) * 100) : 0;

    switch (kpiName) {
      case "Monthly Revenue":
        if (isTargetMet) {
          return {
            rootCause: "High transaction volumes and positive response to commercial bulk fleet deals.",
            impact: "Reaching operating profitability targets ahead of schedule.",
            suggestedAction: "Maintain pricing stability and allocate excess cash reserves to technician onboarding."
          };
        }
        return {
          rootCause: `High checkout abandonment rate (${deficitRate}% below target) and delayed payment reconciliation in the Laravel backend API.`,
          impact: "Negative working capital strain on mobile technician dispatch operations.",
          suggestedAction: "Invoke the Checkout Recovery Campaign via the Command Center and dispatch automated WhatsApp payment links."
        };

      case "Active Bookings":
        if (isTargetMet) {
          return {
            rootCause: "Increased consumer demand due to seasonal monsoon vehicle inspections.",
            impact: "Technician utilization is at 100%, causing capacity bottlenecks.",
            suggestedAction: "Authorize overtime hours and onboard Bangalore partner garages."
          };
        }
        return {
          rootCause: "Technician slot constraints in Bangalore East and Pune hubs leading to 18 rejected booking requests.",
          impact: "Slowing booking cycle velocities and customer churn to local garages.",
          suggestedAction: "Onboard local authorized service centers to increase booking fulfillment and load balancing."
        };

      case "Customer Satisfaction":
        if (isTargetMet) {
          return {
            rootCause: "Excellent response times and high resolution rates for Pune fleet dispatch.",
            impact: "Strong organic referral rates and positive Google reviews.",
            suggestedAction: "Pre-seed customer loyalty discounts for Q3 subscriptions."
          };
        }
        return {
          rootCause: "Extended wait times for spare battery parts and high diagnostic diagnostic delay complaints.",
          impact: "Decreased user retention rates in our active customer cohort.",
          suggestedAction: "Open a priority support ticket for dissatisfied customers and offer goodwill service vouchers."
        };

      case "System Sync Success Rate":
        if (isTargetMet) {
          return {
            rootCause: "Successful deployment of exponential backoff retry routines and orphan placeholder stubs.",
            impact: "Strict referential data integrity maintained between Laravel API and Supabase cache.",
            suggestedAction: "Document this sync architecture in the Knowledge Base for developer onboarding."
          };
        }
        return {
          rootCause: "Frequent HTTP 504 timeouts on Laravel server during peak booking synchronization runs.",
          impact: "Brief data inconsistency where new customer bookings do not resolve immediately in the CEO.",
          suggestedAction: "Increase REST API timeout limits and schedule sync schedules during lower traffic periods."
        };

      case "AMC Subscription Rate":
        if (isTargetMet) {
          return {
            rootCause: "Effective checkout upsell prompting by service center technicians.",
            impact: "Stable and high-margin recurring contract revenue base established.",
            suggestedAction: "Upsell premium roadside assistance packages to existing active AMC clients."
          };
        }
        return {
          rootCause: "Lack of automated customer renewal notices and low penetration among out-of-warranty individual vehicle owners.",
          impact: "Loss of lucrative post-warranty spare parts and servicing revenue streams.",
          suggestedAction: "Trigger the Out-of-Warranty Auto WhatsApp reminder sequence via the Command Center."
        };

      default:
        return {
          rootCause: "Operational fluctuations and standard database changes.",
          impact: "Uncertain long term business metrics impact.",
          suggestedAction: "Monitor this metric closely during daily briefings."
        };
    }
  }

  /**
   * Generates context insights for active device or system alerts.
   */
  static getAlertContext(alertType: string, description: string, severity: string): ContextPayload {
    const descLower = description.toLowerCase();

    if (descLower.includes("battery") || descLower.includes("soh") || descLower.includes("telemetry")) {
      return {
        rootCause: "Battery State of Charge (SOC) remained at 0% for more than 48 hours, causing cell degradation.",
        impact: "Severe battery state of health degradation. Potential high-risk roadside breakdown within 5 days.",
        suggestedAction: "Schedule a priority diagnostic appointment and dispatch a Technician for physical battery cell balancing."
      };
    }
    
    if (descLower.includes("amc") || descLower.includes("lags")) {
      return {
        rootCause: "Low marketing campaign conversion rates and insufficient technician onboarding training on upsells.",
        impact: "Recurring contract revenue is falling below the Q2 budget target by ₹8,500.",
        suggestedAction: "Approve and execute the Pune Fleet AMC WhatsApp discount campaign in the Decision Engine."
      };
    }

    if (descLower.includes("sync") || descLower.includes("failed")) {
      return {
        rootCause: "Integrations database connection timeout on Laravel production API endpoints.",
        impact: "Operational sync is delayed. Outdated customer contact profiles shown in the cockpit.",
        suggestedAction: "Open the Command Center (`Cmd+K`) and trigger 'Retry Failed Sync Records' to process anomalies."
      };
    }

    // Default fallback based on severity
    if (severity === "critical") {
      return {
        rootCause: "Hardware parameter thresholds exceeded or critical operational transaction failure.",
        impact: "High risk of client dissatisfaction or vehicle safety overrides.",
        suggestedAction: "Escalate to the operational supervisor and check the Platform Health status tab."
      };
    }

    return {
      rootCause: "System telemetry notification or standard operational warning.",
      impact: "Low immediate operational risk.",
      suggestedAction: "No immediate emergency action required. Review during weekly briefing."
    };
  }

  /**
   * Generates context insights for proposed decision engine recommendations.
   */
  static getRecommendationContext(title: string, description: string): ContextPayload {
    const titleLower = title.toLowerCase();

    if (titleLower.includes("amc") || titleLower.includes("campaign")) {
      return {
        rootCause: "12 fleet vehicles registered in Pune currently lack service protection contracts, exposing them to high break-fix costs.",
        impact: "Missed opportunity for ₹3,000 in recurring service revenue. High margin commercial churn risk.",
        suggestedAction: "Approve this recommendation to trigger the InnoVibe marketing automation script and send WhatsApp incentives."
      };
    }

    if (titleLower.includes("inspection") || titleLower.includes("diagnostic") || titleLower.includes("mh-12")) {
      return {
        rootCause: "Automated telemetry analysis detected repeating battery temperature anomalies and low SOH on vehicle MH-12-EQ-8834.",
        impact: "Potential catastrophic thermal failure if battery cell balancing is not performed within 72 hours.",
        suggestedAction: "Approve the diagnostic booking creation to automatically allocate Technician Rahul and schedule Garage slots."
      };
    }

    return {
      rootCause: "AI decision engine detected business optimization potential from live event streams.",
      impact: "Improves overall company health metrics and resolves bottlenecks.",
      suggestedAction: "Approve recommendations to translate insights into executable operational tasks."
    };
  }
}
