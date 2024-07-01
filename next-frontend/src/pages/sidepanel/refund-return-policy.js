import styles from '../../styles/sidepanel/Policy.module.css';

const RefundReturnPolicy = () => {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Refund & Return Policy</h1>
      <div className={styles.content}>
        <p>
          At GemTCG, customer satisfaction is our top priority. We understand that sometimes you may need to return a product. Our Refund & Return Policy is designed to make the process as simple and straightforward as possible.
        </p>
        <h2>Return Policy & Process</h2>
        <p>
          If you are not satisfied with your purchase, you can return the item within 30 days of the delivery date. 
          To start a return, navigate to the <a href="/order-history" target="_blank" rel="noopener noreferrer">Order History</a> page and find the order that you would like to return. Click on the "Return Item" button to start a return. 
          A shipping label will then be provided to you, and you can use that label to send the item back to the seller. Once the seller receives the returned item, a full refund will be processed.
          To be eligible for a return, the item must be in its original condition.
        </p>
        <h2>Refund Policy & Process</h2>
        <p>
          If you haven't received your order, navigate to the specific order from the <a href="/order-history" target="_blank" rel="noopener noreferrer">Order History</a> page and click on the "Didn't Receive Item" button. This will notify the seller that your order hasn't arrived and they will then be given up to 3 days to respond to you and offer a solution for you to choose between a full refund or sending out a replacement item. 
          If the seller doesn't respond within the 3 days, a full refund will automatically be processed. 
        </p>
        <h2>Contact Us</h2>
        <p>
          If you have any questions about our Refund & Return Policy, please contact our customer support team at <a href="mailto:contact@gemtcg.com">contact@gemtcg.com</a>, or fill out a contact form on the <a href="/contact" target="_blank" rel="noopener noreferrer">Contact</a> page.
        </p>
      </div>
    </div>
  );
};

export default RefundReturnPolicy;
