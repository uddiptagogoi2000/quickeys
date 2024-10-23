import { Outlet } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

const RootLayout = () => {
  return (
    <>
      <Header />
      <main className='container mx-auto h-[var(--main-height)] flex justify-center items-center px-2'>
        <Outlet />
      </main>
      <Footer />
    </>
  );
};

export default RootLayout;
