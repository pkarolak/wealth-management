import { createBrowserRouter } from 'react-router'
import { ClientApp } from './routes/client/ClientApp'
import { DemoHome } from './routes/DemoHome'
import { Gallery } from './routes/gallery/Gallery'
import { CaseView } from './routes/wm/CaseView'
import { CreateClient } from './routes/wm/CreateClient'
import { Invite } from './routes/wm/Invite'
import { CifView } from './routes/wm/CifView'
import { MeetingBrief } from './routes/wm/MeetingBrief'
import { Overview } from './routes/wm/Overview'
import { WMLayout } from './routes/wm/WMLayout'

export const router = createBrowserRouter([
  { path: '/', element: <DemoHome /> },
  { path: '/gallery', element: <Gallery /> },
  {
    path: '/wm',
    element: <WMLayout />,
    children: [
      { index: true, element: <Overview /> },
      { path: 'new', element: <CreateClient /> },
      { path: 'c/:caseId', element: <CaseView /> },
      { path: 'c/:caseId/edit', element: <CreateClient /> },
      { path: 'c/:caseId/invite', element: <Invite /> },
      { path: 'c/:caseId/brief', element: <MeetingBrief /> },
      { path: 'c/:caseId/cif', element: <CifView /> },
    ],
  },
  { path: '/c/:token', element: <ClientApp /> },
])
