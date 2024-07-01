// pages/about.js
import Image from 'next/image';
import styles from '../../styles/sidepanel/About.module.css';

const About = () => {
    return (
      <div className={styles.container}>
        <h1 className={styles.title}>About Us</h1>
        <div className={styles.images}>
          <div className={styles.imageWrapper}>
            <Image
              src="/images/logoNoName.png"
              alt="Company Logo"
              width={200}
              height={200}
              className={styles.image}
            />
          </div>
          <div className={styles.imageWrapper}>
            <Image
              src="https://media.licdn.com/dms/image/D4E03AQHjFgqC1G0hkw/profile-displayphoto-shrink_800_800/0/1718326543149?e=1725494400&v=beta&t=ETtaKoqxqMb6nkPUDiM1JsnliXxJ_D641vHJwqoe_f0"
              alt="Your Photo"
              width={200}
              height={200}
              className={styles.image}
            />
          </div>
        </div>
        <div className={styles.content}>
          <p>
            Welcome to the GemTCG marketplace! We are dedicated to providing you with the best selection of 
            products, exceptional customer service, and an easy-to-use platform. Our marketplace 
            was founded with the goal of connecting buyers and sellers in a seamless and efficient manner.
          </p>
          <p>
            The creator of the GemTCG Marketplace, Andrew Sassine, began selling Pokemon cards in 2020. Since then, he has moved on to selling sports cards, graded cards, and many other collectibles. 
            His goal with GemTCG is to create a trusted marketplace that can provide accurate data on PSA graded card values, and to allow sellers to list cards quickly,
            and for buyers to be able to browse millions of unique cards.
          </p>
          <p>
            Our team is passionate about creating a community where users can discover unique items, 
            support independent sellers, and enjoy a personalized shopping experience. Thank you for 
            choosing our marketplace, and we look forward to serving you!
          </p>
        </div>
      </div>
    );
  };
  
  export default About;
  