"use client";

import styles from "@/styles/supplier-guide.module.css";
import { FaBookOpen, FaLightbulb, FaRocket } from "react-icons/fa";

export default function SupplierGuidePage() {
  return (
    <div>
      <h1 className={styles.guideTitle}>
        <FaBookOpen style={{ marginRight: 12, color: '#7c3aed', verticalAlign: 'middle' }} size={32} />
        Supplier Guide
      </h1>
      <p className={styles.guideText}>
        Welcome to the NexMart Supplier Guide. Here you will find step-by-step instructions and best practices for managing your products, orders, and profile.
      </p>
      <div className={styles.guideSection}>
        <h2 className={styles.guideSectionTitle}>
          <FaRocket style={{ marginRight: 8, color: '#7c3aed', verticalAlign: 'middle' }} />
          Getting Started
        </h2>
        <ol className={styles.guideList}>
          <li>
            <strong>Complete your profile information.</strong>
            <div className={styles.guideStep}>Ensure your business and contact details are accurate for smooth transactions.</div>
          </li>
          <li>
            <strong>Add your first product.</strong>
            <div className={styles.guideStep}>Go to Products &gt; Add Product and provide all required information.</div>
          </li>
          <li>
            <strong>Review and fulfill restock requests.</strong>
            <div className={styles.guideStep}>Monitor notifications and respond promptly to restock needs.</div>
          </li>
          <li>
            <strong>Track your orders and payments.</strong>
            <div className={styles.guideStep}>Use the Orders and Payments sections to manage your business efficiently.</div>
          </li>
        </ol>
      </div>
      <div className={styles.guideSection}>
        <h2 className={styles.guideSectionTitle}>
          <FaLightbulb style={{ marginRight: 8, color: '#facc15', verticalAlign: 'middle' }} />
          Tips for Success
        </h2>
        <ul className={styles.guideList}>
          <li>
            <strong>Keep your product information up to date.</strong>
            <div className={styles.guideStep}>Regularly review and update product details for accuracy.</div>
          </li>
          <li>
            <strong>Respond promptly to restock requests.</strong>
            <div className={styles.guideStep}>Timely responses help maintain good customer relationships.</div>
          </li>
          <li>
            <strong>Contact support if you need help.</strong>
            <div className={styles.guideStep}>Our support team is here to assist you with any issues.</div>
          </li>
        </ul>
      </div>
    </div>
  );
}
