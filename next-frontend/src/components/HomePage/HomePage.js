import React from 'react';
import BannerCarousel from '../BannerCarousel/BannerCarousel';
import Image from 'next/image';
import Link from 'next/link';
import styles from './HomePage.module.css';

function HomePage() {
  const categories = [
    { name: 'Pokemon (English)', imageUrl: 'https://d1htnxwo4o0jhw.cloudfront.net/cert/150196677/iaBYQ0XcMk63WuxjI7udFw.jpg', path: '/pokemon-english' },
    { name: 'Pokemon (Japan)', imageUrl: 'https://d1htnxwo4o0jhw.cloudfront.net/cert/150272806/QFjB7Z7N_kSl88Wdh5q5bQ.jpg', path: '/pokemon-japan' },
    { name: 'Football', imageUrl: 'https://d1htnxwo4o0jhw.cloudfront.net/cert/153164746/obPXafsUM06sEy5QfG1J4Q.jpg', path: '/football' },
    { name: 'Baseball', imageUrl: 'https://d1htnxwo4o0jhw.cloudfront.net/cert/146332650/WNZViIpBpk2ktqaAYy1H-Q.jpg', path: '/baseball' },
    { name: 'Basketball', imageUrl: 'https://d1htnxwo4o0jhw.cloudfront.net/cert/152159033/boZU63YbFEeXx3R2nX_yVg.jpg', path: '/basketball' },
    { name: 'Hockey', imageUrl: 'https://d1htnxwo4o0jhw.cloudfront.net/cert/148722417/tawOt2JTSEC39QS4H9wR5g.jpg', path: '/hockey' }
  ];

  return (
    <div>
      <BannerCarousel />
      <section className={styles.shopCategories}>
        <h2 className={styles.categoriesHeader}>Shop Categories</h2>
        <div className={styles.categoryCards}>
          {categories.map((category) => (
            <div key={category.name} className={styles.categoryCard}>
              <Link href={category.path}>
                <div>
                  <h3>{category.name}</h3>
                  <Image src={category.imageUrl} alt={category.name} width={300} height={300} layout="intrinsic" />
                </div>
              </Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default HomePage;
