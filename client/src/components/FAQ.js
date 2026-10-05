import { useState } from "react";
import { Helmet } from "react-helmet-async";

const faqs = [
  {
    question: "Where is Raja Rani Indian Restaurant located?",
    answer:
      "Raja Rani Indian Restaurant is located at 45172 Ford Road, Canton, MI 48187.",
  },
  {
    question: "What are Raja Rani's hours?",
    answer:
      "We're open Tuesday through Sunday, 11:30 am–3 pm for lunch and 5–9:30 pm for dinner (until 10 pm Friday and Saturday). We're closed on Mondays.",
  },
  {
    question: "Does Raja Rani serve Halal food?",
    answer:
      "Yes. All meat served at Raja Rani is 100% Halal, and we offer both vegetarian and non-vegetarian dishes.",
  },
  {
    question: "What kind of food does Raja Rani serve?",
    answer:
      "We serve authentic South Indian cuisine — crispy dosas, idli, sambar, biryanis, Chettinad specialties, and traditional Tamil and Andhra dishes — alongside North Indian curries.",
  },
  {
    question: "Can I order online or does Raja Rani only do dine-in?",
    answer:
      "Both. You can order online for pickup or delivery, or dine in at our Canton, MI location.",
  },
  {
    question: "Does Raja Rani offer catering?",
    answer:
      "Yes, we cater for events of all sizes. Call us at 734-404-5523 or email rajaranicanton2@gmail.com to discuss your catering needs.",
  },
];

function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <div
      style={{
        maxWidth: "900px",
        margin: "40px auto",
        padding: "0 20px",
      }}
    >
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify(faqSchema)}
        </script>
      </Helmet>
      <h2
        style={{
          color: "white",
          textAlign: "center",
          fontSize: "24px",
          fontWeight: "bold",
          marginBottom: "20px",
        }}
      >
        FREQUENTLY ASKED QUESTIONS
      </h2>
      <div>
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <div
              key={faq.question}
              style={{
                border: "1px solid #444",
                borderRadius: "8px",
                marginBottom: "10px",
                background: "rgba(255, 255, 255, 0.05)",
                overflow: "hidden",
              }}
            >
              <button
                onClick={() => setOpenIndex(isOpen ? null : index)}
                aria-expanded={isOpen}
                style={{
                  width: "100%",
                  textAlign: "left",
                  background: "transparent",
                  border: "none",
                  color: "white",
                  fontSize: "16px",
                  fontWeight: "bold",
                  padding: "14px 16px",
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                {faq.question}
                <span style={{ color: "#f4a261", marginLeft: "12px" }}>
                  {isOpen ? "−" : "+"}
                </span>
              </button>
              {isOpen && (
                <p
                  style={{
                    color: "#ddd",
                    padding: "0 16px 16px",
                    margin: 0,
                    lineHeight: "1.6",
                  }}
                >
                  {faq.answer}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default FAQ;
