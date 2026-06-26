import { EventClickArg, EventDropArg, EventInput } from "@fullcalendar/core/index.js";
import { ReactNode } from "react";
import { Control, FieldPath, FieldValues } from "react-hook-form";
import { OffcanvasControlType } from "./layout";
import { DateClickArg, DropArg } from "@fullcalendar/interaction/index.js";
import { IconProps } from "react-toastify";
import { ColumnDef, PaginationState, Table, TableOptions } from "@tanstack/react-table";

export type ChildrenType = Readonly<{ children: ReactNode }>


export type BootstrapVariantType = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'dark' | 'light'

export type FormInputProps<TFieldValues extends FieldValues = FieldValues, TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>> = {
  control: Control<TFieldValues>
  name: TName
  id?: string
  containerClassName?: string
  label?: string | ReactNode
  placeholder?: string
  noValidate?: boolean
  labelClassName?: string
}

export type CalendarFormType = {
  isEditable: boolean
  eventData?: EventInput
  onUpdateEvent: (data: any) => void
  onRemoveEvent: () => void
  onAddEvent: (data: any) => void
} & OffcanvasControlType


export type CalendarProps = {
  onDateClick: (arg: DateClickArg) => void
  onEventClick: (arg: EventClickArg) => void
  onDrop: (arg: DropArg) => void
  onEventDrop: (arg: EventDropArg) => void
  events: EventInput[]
}

export type UploadFileType = File & {
  path?: string
  preview?: string
  formattedSize?: string
}


export type DropzoneFormInputProps = {
  label?: string
  className?: string
  labelClassName?: string
  helpText?: ReactNode | string
  showPreview?: boolean
  iconProps?: IconProps
  text?: string
  textClassName?: string
  onFileUpload?: (files: UploadFileType[]) => void
}

export type ReactTableProps<RowType> = {
  options?: TableOptions<RowType>
  columns: ColumnDef<RowType>[]
  data: RowType[]
  showPagination?: boolean
  rowsPerPageList?: number[]
  isSearchable?: boolean
  isSelectable?: boolean
  isExpandable?: boolean
  pageSize?: number
  tableClass?: string
  theadClass?: string
  searchBoxClass?: string
}

export type ReactTablePaginationProps<RowType> = {
  table: Table<RowType>
  rowsPerPageList?: number[]
  currentPage: number
  totalPages: number
  pagination: PaginationState
}
