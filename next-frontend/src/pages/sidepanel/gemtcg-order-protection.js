// pages/sidepanel/gemtcg-order-protection.js
import styles from '../../styles/sidepanel/Policy.module.css';

const GemTCGOrderProtection = () => {
    return (
      <div className={styles.container}>
        <h1 className={styles.title}>GemTCG Order Protection</h1>
        <div className={styles.content}>
          <p>
            At GemTCG, we are committed to ensuring the safety and security of your purchases. Our Order Protection program is designed to provide you with peace of mind and confidence when shopping on our marketplace.
          </p>
          <h2>Order Protection Features</h2>
          <p>
            Our Order Protection includes the following features:
          </p>
          <ul>
            <li>100% Purchase Protection: We guarantee that you will receive the item you ordered, in the condition you expected, or your money back.</li>
            <li>Secure Transactions: All transactions are secured with industry-standard encryption to protect your personal and payment information.</li>
            <li>Dispute Resolution: Our customer support team is here to help you resolve any issues with your order, ensuring a satisfactory outcome.</li>
          </ul>
          <h2>How It Works</h2>
          <p>
            If you encounter any issues with your order, such as receiving a damaged or incorrect item, or not receiving your order at all, 
            you are eligible to request a refund or return the order. Simply navigate to the <a href="/order-history" target="_blank" rel="noopener noreferrer">Order History </a> 
            page and select the "Return Item" or "Didn't Receive Item" button and a case will be opened. If you don't hear back from the seller within 3 days, a full refund will be processed.
          </p>
          <h2>Contact Us</h2>
          <p>
            If you have any questions or concerns about our Order Protection program, please reach out to us at support@gemtcg.com. We are here to assist you and ensure a safe and enjoyable shopping experience.
          </p>
        </div>
      </div>
    );
  };
  
  export default GemTCGOrderProtection;
  