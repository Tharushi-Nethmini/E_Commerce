"use client";

import styles from "@/styles/supplier-support.module.css";
import { FaEnvelope, FaPhoneAlt, FaQuestionCircle, FaLifeRing } from "react-icons/fa";

export default function SupplierSupportPage() {
  return (
    <div>
      <h1 className={styles.supportTitle}>
        <FaLifeRing style={{ marginRight: 12, color: '#7c3aed', verticalAlign: 'middle' }} size={32} />
        Supplier Support
      </h1>
      <div className={styles.contactSection}>
        <div className={styles.contactItem}>
          <FaEnvelope className={styles.contactIcon} />
          <a href="mailto:support@nexmart.com" className={styles.supportLink}>support@nexmart.com</a>
        </div>
        <div className={styles.contactItem}>
          <FaPhoneAlt className={styles.contactIcon} />
          <span className={styles.supportLink}>+94 11 234 5678</span>
        </div>
      </div>
      <div className={styles.supportSection}>
        <h2 className={styles.faqTitle}>
          <FaQuestionCircle style={{ marginRight: 8, color: '#7c3aed', verticalAlign: 'middle' }} />
          Frequently Asked Questions
        </h2>
        <ul className={styles.faqList}>
          <li>
            <strong>How do I add a new product?</strong>
            <div className={styles.faqAnswer}>Go to Products &gt; Add Product and fill in the required details.</div>
          </li>
          <li>
            <strong>How do I track my orders?</strong>
            <div className={styles.faqAnswer}>Navigate to Orders to view and manage your order history.</div>
          </li>
          <li>
            <strong>How do I update my profile?</strong>
            <div className={styles.faqAnswer}>Click on Profile in the sidebar to update your information.</div>
          </li>
          <li>
            <strong>How do I request a restock?</strong>
            <div className={styles.faqAnswer}>Select the product and click on Request Restock in the product details.</div>
          </li>
        </ul>
      </div>
    </div>
  );
}
