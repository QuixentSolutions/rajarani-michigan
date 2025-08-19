import React, { useState } from 'react';

const AdminLogin = ({ onLoginSuccess }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [focusedInput, setFocusedInput] = useState('');

    const styles = {
        loginContainer: {
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            backgroundColor: '#f8f9fa',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            fontFamily: 'Arial, sans-serif',
        },
        loginBox: {
            padding: '2.5em',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '20px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
            backdropFilter: 'blur(10px)',
            width: '400px',
            textAlign: 'center',
        },
        logo: {
            fontSize: '2.5rem',
            fontWeight: 'bold',
            color: '#FFA500',
            marginBottom: '30px',
            textShadow: '2px 2px 4px rgba(0, 0, 0, 0.1)',
        },
        inputGroup: {
            marginBottom: '20px',
            textAlign: 'left',
        },
        label: {
            display: 'block',
            marginBottom: '8px',
            color: '#333',
            fontWeight: 'bold',
        },
        input: {
            width: '100%',
            padding: '15px',
            border: '2px solid #e0e0e0',
            borderRadius: '10px',
            fontSize: '16px',
            boxSizing: 'border-box',
            transition: 'border-color 0.3s ease',
        },
        inputFocus: {
            borderColor: '#FFA500',
            outline: 'none',
        },
        button: {
            width: '100%',
            padding: '15px 30px',
            border: 'none',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #FFA500 0%, #FF8C00 100%)',
            color: 'white',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            marginTop: '10px',
        },
        buttonDisabled: {
            background: '#ccc',
            cursor: 'not-allowed',
        },
        error: {
            background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
            color: 'white',
            padding: '15px',
            borderRadius: '10px',
            marginTop: '20px',
            fontSize: '14px',
        },
        loading: {
            color: '#FFA500',
            fontSize: '14px',
            marginTop: '10px',
        }
    };

    // Hardcoded credentials validation
    const validateCredentials = (username, password) => {
        if (username === 'admin' && password === 'password123') {
            const token = 'Basic ' + btoa(`${username}:${password}`);
            return { success: true, token };
        } else {
            return { success: false, error: 'Invalid username or password' };
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        // Basic validation
        if (!username.trim() || !password.trim()) {
            setError('Please enter both username and password');
            setIsLoading(false);
            return;
        }

        // Simulate loading for better UX
        setTimeout(() => {
            const result = validateCredentials(username, password);
            
            if (result.success) {
                // Store token in sessionStorage for session persistence
                sessionStorage.setItem('adminToken', result.token);
                // Pass token to parent component
                onLoginSuccess(result.token);
            } else {
                setError(result.error);
            }
            setIsLoading(false);
        }, 500);
    };

    const getInputStyle = (inputName) => ({
        ...styles.input,
        ...(focusedInput === inputName ? styles.inputFocus : {}),
    });

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSubmit(e);
        }
    };

    return (
        <div style={styles.loginContainer}>
            <div style={styles.loginBox}>
                <div style={styles.logo}>🏰 Raja Rani Admin</div>
                <form onSubmit={handleSubmit}>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Username</label>
                        <input
                            type="text"
                            placeholder="Enter your username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            onFocus={() => setFocusedInput('username')}
                            onBlur={() => setFocusedInput('')}
                            onKeyPress={handleKeyPress}
                            style={getInputStyle('username')}
                            disabled={isLoading}
                            required
                        />
                    </div>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Password</label>
                        <input
                            type="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onFocus={() => setFocusedInput('password')}
                            onBlur={() => setFocusedInput('')}
                            onKeyPress={handleKeyPress}
                            style={getInputStyle('password')}
                            disabled={isLoading}
                            required
                        />
                    </div>
                    <button 
                        type="submit"
                        style={{
                            ...styles.button,
                            ...(isLoading ? styles.buttonDisabled : {})
                        }}
                        disabled={isLoading}
                        onMouseEnter={(e) => {
                            if (!isLoading) {
                                e.target.style.transform = 'translateY(-2px)';
                                e.target.style.boxShadow = '0 10px 20px rgba(255, 165, 0, 0.3)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!isLoading) {
                                e.target.style.transform = 'none';
                                e.target.style.boxShadow = 'none';
                            }
                        }}
                    >
                        {isLoading ? 'Logging in...' : 'Login to Admin Panel'}
                    </button>
                </form>
                
                {isLoading && (
                    <div style={styles.loading}>Validating credentials...</div>
                )}
                
                {error && (
                    <div style={styles.error}>{error}</div>
                )}
                
                <div style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
                    Secure admin access for Raja Rani Restaurant
                </div>
                <div style={{ marginTop: '10px', fontSize: '11px', color: '#999' }}>
                    Default credentials: admin / password123
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;