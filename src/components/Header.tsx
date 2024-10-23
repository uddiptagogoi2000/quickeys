import { RiInfoI, RiKeyboardBoxFill, RiSettings3Fill } from '@remixicon/react';
import { Link } from 'react-router-dom';

const Header = () => {
  return (
    <header className='px-2 py-8 container mx-auto'>
      <div className='flex gap-4 items-center'>
        <div className='flex gap-1 items-center'>
          <h1 className='text-4xl font-bold relative'>
            quickeys
            <span className='text-xs font-semibold absolute -top-1 left-[65%] text-gray-600 '>
              be quick
            </span>
          </h1>
        </div>

        <Link to=''>
          <RiKeyboardBoxFill />
        </Link>
        <RiInfoI />
        <Link to='settings'>
          <RiSettings3Fill />
        </Link>
      </div>
    </header>
  );
};

export default Header;
