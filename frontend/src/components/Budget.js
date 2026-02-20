import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { budgetsAPI, expensesAPI } from '../services/api';

const Budget = () => {
  const [budgets, setBudgets] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [budgetAmount, setBudgetAmount] = useState('');

  useEffect(() => {
    fetchData();
  }, [selectedMonth]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const month = selectedMonth.getMonth() + 1;
      const year = selectedMonth.getFullYear();

      const [budgetRes, analyticsRes] = await Promise.all([
        budgetsAPI.getAll({ month, year }),
        expensesAPI.getAnalytics({ month, year })
      ]);

      setBudgets(budgetRes.data);
      setAnalytics(analyticsRes.data);

      const totalBudget = budgetRes.data.find(b => b.category === 'Total');
      setBudgetAmount(totalBudget ? totalBudget.amount.toString() : '');
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSetBudget = async (e) => {
    e.preventDefault();
    
    if (!budgetAmount || parseFloat(budgetAmount) <= 0) {
      alert('Please enter a valid budget amount');
      return;
    }

    try {
      await budgetsAPI.create({
        month: selectedMonth.getMonth() + 1,
        year: selectedMonth.getFullYear(),
        amount: parseFloat(budgetAmount),
        category: 'Total'
      });
      fetchData();
    } catch (error) {
      console.error('Error setting budget:', error);
      alert('Failed to set budget');
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  const totalBudget = budgets.find(b => b.category === 'Total');
  const spent = analytics?.total || 0;
  const remaining = totalBudget ? totalBudget.amount - spent : 0;
  const percentage = totalBudget ? (spent / totalBudget.amount) * 100 : 0;

  return (
    <div className="container">
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Budget Management</h2>
          <input
            type="month"
            value={format(selectedMonth, 'yyyy-MM')}
            onChange={(e) => setSelectedMonth(new Date(e.target.value))}
            className="form-control"
          />
        </div>

        <form onSubmit={handleSetBudget} style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Monthly Budget</label>
              <input
                type="number"
                value={budgetAmount}
                onChange={(e) => setBudgetAmount(e.target.value)}
                placeholder="Enter your budget amount"
                step="0.01"
                min="0"
              />
            </div>
            <button type="submit" className="btn btn-primary">
              Set Budget
            </button>
          </div>
        </form>

        {totalBudget ? (
          <>
            <div className="dashboard-grid">
              <div className="stat-card">
                <h3>Total Budget</h3>
                <div className="amount">${totalBudget.amount.toFixed(2)}</div>
              </div>

              <div className="stat-card">
                <h3>Spent</h3>
                <div className="amount">${spent.toFixed(2)}</div>
                <p>{percentage.toFixed(1)}% of budget</p>
              </div>

              <div className="stat-card">
                <h3>Remaining</h3>
                <div className="amount" style={{ 
                  color: remaining < 0 ? '#ef4444' : 'inherit' 
                }}>
                  ${remaining.toFixed(2)}
                </div>
                <p>{remaining < 0 ? 'Over budget!' : 'Available'}</p>
              </div>
            </div>

            <div className="card">
              <h3>Budget Progress</h3>
              <div style={{ 
                background: '#e5e7eb', 
                borderRadius: '8px', 
                overflow: 'hidden',
                height: '40px',
                marginTop: '1rem'
              }}>
                <div style={{
                  width: `${Math.min(percentage, 100)}%`,
                  height: '100%',
                  background: percentage > 100 ? '#ef4444' : 
                             percentage > 80 ? '#f59e0b' : '#10b981',
                  transition: 'width 0.3s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: '600'
                }}>
                  {percentage.toFixed(1)}%
                </div>
              </div>

              {percentage > 100 && (
                <div className="alert alert-error" style={{ marginTop: '1rem' }}>
                  ⚠️ You have exceeded your budget by ${Math.abs(remaining).toFixed(2)}
                </div>
              )}

              {percentage > 80 && percentage <= 100 && (
                <div style={{ 
                  marginTop: '1rem', 
                  padding: '1rem', 
                  backgroundColor: '#fef3c7',
                  borderRadius: '8px',
                  color: '#92400e'
                }}>
                  ⚠️ You've used {percentage.toFixed(1)}% of your budget. Consider your spending carefully.
                </div>
              )}
            </div>

            {analytics?.byCategory && (
              <div className="card">
                <h3>Spending by Category</h3>
                <div style={{ marginTop: '1rem' }}>
                  {Object.entries(analytics.byCategory).map(([category, amount]) => {
                    const categoryPercentage = totalBudget ? (amount / totalBudget.amount) * 100 : 0;
                    return (
                      <div key={category} style={{ marginBottom: '1.5rem' }}>
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between',
                          marginBottom: '0.5rem'
                        }}>
                          <span>{category}</span>
                          <span style={{ fontWeight: '600' }}>
                            ${amount.toFixed(2)} ({categoryPercentage.toFixed(1)}%)
                          </span>
                        </div>
                        <div style={{ 
                          background: '#e5e7eb', 
                          borderRadius: '4px', 
                          overflow: 'hidden',
                          height: '8px'
                        }}>
                          <div style={{
                            width: `${Math.min(categoryPercentage, 100)}%`,
                            height: '100%',
                            background: '#6366f1',
                            transition: 'width 0.3s'
                          }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="card">
              <h3>Budget Tips</h3>
              <ul style={{ 
                marginTop: '1rem', 
                paddingLeft: '1.5rem',
                color: '#6b7280',
                lineHeight: '1.8'
              }}>
                <li>Review your spending regularly to stay on track</li>
                <li>Set category-specific budgets for better control</li>
                <li>Try the 50/30/20 rule: 50% needs, 30% wants, 20% savings</li>
                <li>Build an emergency fund with 3-6 months of expenses</li>
                <li>Use the expense filters to identify areas where you can cut back</li>
              </ul>
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <h3>No budget set for this month</h3>
            <p style={{ color: '#6b7280', marginTop: '1rem' }}>
              Enter a budget amount above to start tracking your spending
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Budget;
