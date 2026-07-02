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

      case "Customer Satisfaction (CSAT)":
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

      case "AMC Conversion Rate":
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

      case "Average Service Turnaround Time":
        if (currentValue <= target) { // For time, lower is better
          return {
            rootCause: "Optimized garage bay allocations and real-time technician workload balancing.",
            impact: "High customer satisfaction and increased booking throughput per hub.",
            suggestedAction: "Maintain current slot scheduling rules and document best practices for new partner garages."
          };
        }
        return {
          rootCause: `Delays in parts dispatch and technician scheduling conflicts in high-density areas.`,
          impact: "Customer vehicle downtime exceeded targets by average of 1.2 hours.",
          suggestedAction: "Implement predictive parts pre-stocking based on scheduled maintenance calendars."
        };

      case "Repeat Customer Rate":
        if (isTargetMet) {
          return {
            rootCause: "Strong post-service customer success follow-ups and high-quality first-time fixes.",
            impact: "Reduced customer acquisition costs and built a highly loyal EV owner cohort.",
            suggestedAction: "Implement a tiered referral program to leverage this highly satisfied base."
          };
        }
        return {
          rootCause: "Limited marketing touchpoints after initial booking and absence of structured loyalty incentives.",
          impact: "Increased customer acquisition costs as users try alternative local providers.",
          suggestedAction: "Automate a 90-day post-service follow-up campaign offering special health check coupons."
        };

      case "Membership Conversion Rate":
        if (isTargetMet) {
          return {
            rootCause: "Highly competitive membership pricing and compelling bundle benefits.",
            impact: "Predictable recurring fee streams and improved ecosystem retention.",
            suggestedAction: "Expand membership benefits to include smart charging partner discounts."
          };
        }
        return {
          rootCause: "Low user awareness of the membership plan advantages during checkout.",
          impact: "Missed high-margin subscription revenue from regular EV commuters.",
          suggestedAction: "Add a membership upsell prompt in the booking flow showing direct cost savings."
        };

      case "Technician Productivity":
        if (isTargetMet) {
          return {
            rootCause: "Efficient routing from dispatch systems and positive resolution of skill mismatches.",
            impact: "Higher daily job completion rates and optimal labor utilization.",
            suggestedAction: "Roll out performance-based bonuses to the top 25% of technicians."
          };
        }
        return {
          rootCause: "High travel times between customer sites and outdated route navigation patterns.",
          impact: "Lower daily technician utilization rate, increasing operational cost per booking.",
          suggestedAction: "Implement real-time geographic zone routing to group bookings by technician location."
        };

      case "Monthly Recurring Revenue (MRR)":
        if (isTargetMet) {
          return {
            rootCause: "Consistent growth in active AMC subscriptions and premium membership plan enrollments.",
            impact: "Provides a reliable baseline revenue of ₹25,000+ per month, shielding from seasonal dip risk.",
            suggestedAction: "Invest a portion of recurring revenue into expanding diagnostic tool software."
          };
        }
        return {
          rootCause: `Higher than expected churn of AMC renewals and low initial membership uptake.`,
          impact: "Strains corporate cash flow projections and increases break-even targets.",
          suggestedAction: "Trigger automated AMC renewal campaigns with special early-bird discounts."
        };

      case "First-time Fix Rate":
        if (isTargetMet) {
          return {
            rootCause: "High adherence to diagnostic checklist protocols and strict quality checks before vehicle dispatch.",
            impact: "Reduces cost of repeat visits and builds high operational confidence.",
            suggestedAction: "Publish the current checklists as mandatory training guidelines for new technicians."
          };
        }
        return {
          rootCause: `Increased repeat issues relating to motor diagnostics within 14 days of initial fixes.`,
          impact: "Higher rework costs and localized customer frustration.",
          suggestedAction: "Enforce diagnostic double-checks for all motor repairs and schedule refresher training."
        };

      case "Net Promoter Score (NPS)":
        if (isTargetMet) {
          return {
            rootCause: "Proactive customer relationship campaigns and high resolution scores on WhatsApp follow-ups.",
            impact: "Strong organic referral rates and lower customer acquisition costs.",
            suggestedAction: "Target promoters with referral programs and early-bird subscription renewals."
          };
        }
        return {
          rootCause: "Extended turnaround delays and parts transit delays leading to high detractor counts.",
          impact: "Negative word-of-mouth and risk of customer churn to local garages.",
          suggestedAction: "Establish a priority resolution queue for dissatisfied clients and dispatch goodwill vouchers."
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
