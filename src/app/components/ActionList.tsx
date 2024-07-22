'use client'

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AgGridReact } from 'ag-grid-react';
import { ColDef } from 'ag-grid-community';
import { Input, Tabs } from 'antd';
import { BulkActionStatus } from '../ActionListEnum';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../../store';
import { setBulkActions, addNewBulkAction, updateBulkAction } from '../../../store/features/bulk-actions/bulkActionSlice';
import { IBulkAction } from '../interface';
import Pusher from 'pusher-js';


interface ActionSummary {
    total: number;
    completed: number;
    inProgress: number;
    pending: number;
    scheduled: number;
}

const { TabPane } = Tabs;
const { Search } = Input;

const ActionList: React.FC = () => {
    const dispatch = useDispatch();
    const actions = useSelector((state: RootState) => state.bulkActions.bulkActions);
    const [filteredActions, setFilteredActions] = useState<IBulkAction[]>([]);
    const [summary, setSummary] = useState<ActionSummary>({
        total: 0,
        completed: 0,
        inProgress: 0,
        pending: 0,
        scheduled: 0,
    });
    const router = useRouter();

    useEffect(() => {
        const fetchActions = async () => {
            try {
                const response = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/bulk-action`);
                dispatch(setBulkActions(response.data));
            } catch (error) {
                console.error('Error fetching actions:', error);
            }
        };

        fetchActions();


        const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
            cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!
        });

        // Subscribe to the channel
        const channel = pusher.subscribe('bulk-action');

        // Bind to the event
        channel.bind('new-bulk-action', (data: any) => {
            console.log('Received data:', data);
            dispatch(addNewBulkAction(data.bulkAction));
        });

        channel.bind('bulk-action-updated', (data: any) => {
            console.log('Received data:', data);
            dispatch(updateBulkAction(data.bulkAction));
        });

        // Cleanup function
        return () => {
            channel.unbind_all();
            channel.unsubscribe();
        };
    }, [dispatch]);

    useEffect(() => {
        setFilteredActions(actions);
        calculateSummary(actions);
    }, [actions]);

    const calculateSummary = (actions: IBulkAction[]) => {
        const newSummary: ActionSummary = {
            total: actions.length,
            completed: actions.filter(action => action.status === BulkActionStatus.COMPLETED).length,
            inProgress: actions.filter(action => action.status === BulkActionStatus.IN_PROGRESS).length,
            pending: actions.filter(action => action.status === BulkActionStatus.PENDING).length,
            scheduled: actions.filter(action => action.status === BulkActionStatus.SCHEDULED).length,
        };
        setSummary(newSummary);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString();
    };

    const getStatusColor = (status: BulkActionStatus) => {
        switch (status) {
            case BulkActionStatus.COMPLETED:
                return 'bg-green-100';
            case BulkActionStatus.IN_PROGRESS:
                return 'bg-blue-100';
            case BulkActionStatus.PENDING:
                return 'bg-yellow-100';
            case BulkActionStatus.SCHEDULED:
                return 'bg-purple-100';
            default:
                return 'bg-gray-100';
        }
    };

    const columnDefs: ColDef[] = [
        {
            headerName: 'Action ID',
            field: 'actionId',
            filter: true,
            width: 300,
            cellRenderer: (params: any) => (
                <span
                    className="text-blue-600 hover:text-blue-800 cursor-pointer"
                    onClick={() => router.push(`/actions/${params.value}`)}
                >
                    {params.value}
                </span>
            )
        },
        { headerName: 'Total Records', field: 'totalRecords', filter: 'agNumberColumnFilter' },
        { headerName: 'Created At', field: 'createdAt', valueFormatter: params => formatDate(params.value) },
        { headerName: 'Action Type', field: 'actionType' },
        {
            headerName: 'Status',
            field: 'status',
            cellRenderer: (params: any) => (
                <span className={`px-2 py-1 rounded ${getStatusColor(params.value)}`}>
                    {params.value}
                </span>
            )
        },
        { headerName: 'Entity', field: 'entity' },
    ];

    const onSearch = (value: string) => {
        const filtered = actions.filter(action =>
            action.actionId.toLowerCase().includes(value.toLowerCase())
        );
        setFilteredActions(filtered);
    };

    const onTabChange = (key: string) => {
        if (key === 'all') {
            setFilteredActions(actions);
        } else {
            const filtered = actions.filter(action => action.status === key);
            setFilteredActions(filtered);
        }
    };

    return (
        <div className="bg-white [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)] rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-600">Bulk Actions Summary</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                <SummaryItem label="Total Actions" value={summary.total} color="bg-gray-100" />
                <SummaryItem label="Completed" value={summary.completed} color="bg-green-100" />
                <SummaryItem label="In Progress" value={summary.inProgress} color="bg-blue-100" />
                <SummaryItem label="Pending" value={summary.pending} color="bg-yellow-100" />
                <SummaryItem label="Scheduled" value={summary.scheduled} color="bg-purple-100" />
            </div>
            <div className="flex justify-between mb-4">
                <Search
                    placeholder="Search by Action ID"
                    onSearch={onSearch}
                    style={{ width: 300 }}
                />
                <Tabs defaultActiveKey="all" onChange={onTabChange}>
                    <TabPane tab="All" key="all" />
                    <TabPane tab="Completed" key={BulkActionStatus.COMPLETED} />
                    <TabPane tab="In Progress" key={BulkActionStatus.IN_PROGRESS} />
                    <TabPane tab="Pending" key={BulkActionStatus.PENDING} />
                    <TabPane tab="Scheduled" key={BulkActionStatus.SCHEDULED} />
                </Tabs>
            </div>
            <div className="ag-theme-alpine" style={{ height: 400, width: '100%' }}>
                <AgGridReact
                    columnDefs={columnDefs}
                    rowData={filteredActions}
                    pagination={true}
                    paginationPageSize={10}
                />
            </div>
        </div>
    );
};

const SummaryItem: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => {
    return (
        <div className={`${color} p-4 rounded-md`}>
            <h3 className="text-sm font-semibold text-gray-600">{label}</h3>
            <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
    );
};

export default ActionList;
