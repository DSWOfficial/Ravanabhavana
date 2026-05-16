import { Component } from 'react';
import { Link } from 'react-router-dom';

export default class AdminErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[AdminErrorBoundary] admin page crashed:', error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <main className="section container-shell">
        <div className="rounded-lg bg-red-50 p-5 text-red-700">
          <h1 className="text-2xl font-black">Admin page error</h1>
          <p className="mt-3 font-semibold">{this.state.error.message || String(this.state.error)}</p>
          <Link className="btn btn-primary mt-5" to="/admin">Back to Admin Home</Link>
        </div>
      </main>
    );
  }
}
