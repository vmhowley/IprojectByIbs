import NProgress from 'nprogress';
import 'nprogress/nprogress.css';

// Configure NProgress
NProgress.configure({
  showSpinner: true,
  trickleSpeed: 200,
  minimum: 0.08,
});

export default NProgress;
