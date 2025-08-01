import './ReviewBanner.css';
import { FaGoogle } from 'react-icons/fa';

function ReviewBanner() {
  return (
    <div className="review-banner">
      <span className="review-text">Review us on Google</span>
        <a
        href="https://www.google.com/search?q=Raja+Rani+Restaurant&stick=H4sIAAAAAAAA_-NgU1I1qLCwME4yNTZMMTZPsTQ0MjK2MqhISbKwNDI0MzK0MDCySDNOWsQqEpSYlagQlJiXqRCUWlySWFqUmFcCAG2OMVdAAAAA&hl=en-GB&mat=CXkHHWDwBxApElcB8pgkaH1MxZK1YEYmOhr9L--IjKRUUN5SaGQDfjKXvZuHgOkyez4TJObGNWdGEsBGtuymvcWTJ0VYn47nPHxgyISdH8w_QHoLHJgIPbP9UAs8dZA7Ef8&authuser=0"
        target="_blank"
        rel="noopener noreferrer"
      >
        <FaGoogle className="google-icon" />
      </a>
    </div>
  );
}

export default ReviewBanner;
