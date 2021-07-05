import Link from 'next/link';

import styles from './header.module.scss';

const Header: React.FC = () => {
  return (
    <header className={styles.container}>
      <Link href="/">
        <a>
          <img src="/Logo.svg" alt="logo" />
        </a>
      </Link>
    </header>
  );
};

export default Header;
